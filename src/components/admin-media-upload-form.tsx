"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  getVideoUploadPartCount,
  isSupportedMp4File,
  maxVideoUploadBytes,
  videoUploadPartBytes,
} from "@/lib/media-upload";

type UploadResult = {
  error?: string;
  uploadUrl?: string;
  uploadToken?: string;
  partCount?: number;
};

type CompletedUploadPart = {
  partNumber: number;
  etag: string;
};

type UploadError = Error & { retryable: boolean };

function createUploadError(message: string, retryable: boolean): UploadError {
  return Object.assign(new Error(message), { retryable });
}

function isRetryableUploadError(error: Error): error is UploadError {
  return "retryable" in error && typeof error.retryable === "boolean" && error.retryable;
}

function uploadVideoPart(
  url: string,
  filePart: Blob,
  partNumber: number,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
) {
  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.timeout = 5 * 60 * 1000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        const etag = request.getResponseHeader("ETag");
        if (etag) resolve(etag);
        else reject(new Error(`Storage did not confirm video part ${partNumber}. Please retry.`));
      } else {
        reject(createUploadError(
          `Storage rejected video part ${partNumber} (HTTP ${request.status}).`,
          request.status === 0 || request.status >= 500,
        ));
      }
    };
    request.onerror = () => {
      reject(createUploadError(
        `Connection interrupted while uploading video part ${partNumber}. Check the connection and retry.`,
        true,
      ));
    };
    request.ontimeout = () => {
      reject(createUploadError(
        `Video part ${partNumber} timed out. It can be retried safely.`,
        true,
      ));
    };
    request.onabort = () => reject(new Error(`Video part ${partNumber} upload was cancelled.`));
    if (signal.aborted) {
      reject(new Error(`Video part ${partNumber} upload was cancelled.`));
      return;
    }
    const abortRequest = () => request.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    request.onloadend = () => signal.removeEventListener("abort", abortRequest);
    request.send(filePart);
  });
}

export function AdminMediaUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function postVideoAction(
    payload: Record<string, unknown>,
  ): Promise<UploadResult> {
    let response: Response;
    try {
      response = await fetch("/api/admin/media/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw createUploadError(
        error instanceof Error ? error.message : "The upload service could not be reached.",
        true,
      );
    }

    let result: UploadResult;
    try {
      result = (await response.json()) as UploadResult;
    } catch {
      throw createUploadError(
        "The upload service returned an unreadable response. Retry the upload.",
        response.status === 429 || response.status >= 500,
      );
    }
    if (!response.ok) {
      throw createUploadError(
        result.error ?? "The video could not be uploaded.",
        response.status === 429 || response.status >= 500,
      );
    }
    return result;
  }

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const file = formData.get("file");
    const altText = formData.get("altText");
    const category = formData.get("category");
    if (!(file instanceof File) || typeof altText !== "string" || typeof category !== "string") {
      setIsError(true);
      setMessage("Choose a media file and add its description.");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setMessage("");
    setIsError(false);
    let uploadToken: string | undefined;
    let completed = false;
    try {
      if (mediaType === "video") {
        if (!isSupportedMp4File(file)) {
          throw new Error("Choose an MP4 video file.");
        }
        if (file.size > maxVideoUploadBytes) {
          throw new Error("MP4 videos must be 100 MB or smaller.");
        }

        const prepared = await postVideoAction({
          action: "prepare",
          metadata: {
            fileName: file.name,
            bytes: file.size,
            mimeType: file.type,
            altText,
            category,
          },
        });
        if (!prepared.uploadToken || prepared.partCount !== getVideoUploadPartCount(file.size)) {
          throw new Error("The upload service returned incomplete video upload details.");
        }
        uploadToken = prepared.uploadToken;
        const partCount = prepared.partCount;
        const partProgress = new Array<number>(partCount).fill(0);
        const completedParts: CompletedUploadPart[] = [];
        let nextPart = 0;
        let failed = false;
        let uploadFailure: Error | null = null;
        const abortController = new AbortController();

        const refreshProgress = () => {
          const uploadedBytes = partProgress.reduce((sum, value) => sum + value, 0);
          setProgress(Math.min(99, Math.floor((uploadedBytes / file.size) * 100)));
        };

        const uploadWorker = async () => {
          while (!failed) {
            const partIndex = nextPart++;
            if (partIndex >= partCount) return;

            const partNumber = partIndex + 1;
            const start = partIndex * videoUploadPartBytes;
            const end = Math.min(file.size, start + videoUploadPartBytes);
            const filePart = file.slice(start, end);
            let attempt = 0;

            while (attempt < 3) {
              try {
                const signedPart = await postVideoAction({
                  action: "sign-part",
                  token: uploadToken,
                  partNumber,
                });
                if (!signedPart.uploadUrl) {
                  throw new Error(`A secure upload link for part ${partNumber} was not returned.`);
                }

                const etag = await uploadVideoPart(
                  signedPart.uploadUrl,
                  filePart,
                  partNumber,
                  abortController.signal,
                  (loaded) => {
                    partProgress[partIndex] = loaded;
                    refreshProgress();
                  },
                );
                partProgress[partIndex] = filePart.size;
                completedParts.push({ partNumber, etag });
                refreshProgress();
                break;
              } catch (error) {
                const uploadError =
                  error instanceof Error ? error : new Error("The video part upload failed.");
                const retryable = isRetryableUploadError(uploadError);
                attempt += 1;
                if (!retryable || attempt >= 3) {
                  failed = true;
                  uploadFailure = uploadError;
                  return;
                }
                partProgress[partIndex] = 0;
                refreshProgress();
                await new Promise((resolve) => window.setTimeout(resolve, 600 * attempt));
              }
            }
          }
        };

        const workerCount = Math.min(3, partCount);
        await Promise.all(Array.from({ length: workerCount }, () => uploadWorker()));
        if (uploadFailure) {
          abortController.abort();
          throw uploadFailure;
        }

        completedParts.sort((left, right) => left.partNumber - right.partNumber);
        await postVideoAction({
          action: "complete",
          token: uploadToken,
          parts: completedParts,
        });
        setProgress(100);
        completed = true;
      } else {
        const response = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const result = (await response.json()) as UploadResult;
        if (!response.ok) {
          throw new Error(result.error ?? "The image could not be uploaded.");
        }
      }

      formRef.current.reset();
      setMessage(
        mediaType === "video"
          ? "MP4 video uploaded and added to the media library."
          : "Image uploaded and added to the media library.",
      );
      router.refresh();
    } catch (error) {
      console.error("Could not upload media.", error);
      if (uploadToken && !completed) {
        try {
          await postVideoAction({ action: "cancel", token: uploadToken });
        } catch (cleanupError) {
          console.error("Could not clean up the interrupted video upload.", cleanupError);
        }
      }
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The media could not be uploaded. Check your connection and try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      className="admin-content-form media-upload-form"
      onSubmit={uploadMedia}
      ref={formRef}
    >
      <fieldset className="media-kind-field field-wide" disabled={isUploading}>
        <legend>Media type</legend>
        <label>
          <input
            checked={mediaType === "image"}
            name="mediaType"
            onChange={() => setMediaType("image")}
            type="radio"
            value="image"
          />
          Image
        </label>
        <label>
          <input
            checked={mediaType === "video"}
            name="mediaType"
            onChange={() => setMediaType("video")}
            type="radio"
            value="video"
          />
          MP4 video
        </label>
      </fieldset>
      <label className="field field-wide">
        Choose {mediaType === "video" ? "MP4 video" : "image"} from your computer
        <input
          key={mediaType}
          type="file"
          name="file"
          accept={
            mediaType === "video"
              ? "video/mp4,.mp4"
              : "image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp,image/gif,.gif"
          }
          required
        />
        <small>
          {mediaType === "video"
            ? "MP4 · maximum 100 MB · files can be selected from your computer or a mounted external drive"
            : "JPEG, PNG, WebP, or GIF · maximum 4 MB · files can be selected from your computer or a mounted external drive"}
        </small>
      </label>
      <label className="field">
        Category
        <select key={mediaType} name="category" defaultValue={mediaType === "video" ? "Video" : "General"}>
          <option>General</option>
          <option>Excursion</option>
          <option>Safari</option>
          <option>Destination</option>
          {mediaType === "video" && <option>Video</option>}
        </select>
      </label>
      <label className="field">
        {mediaType === "video" ? "Video description" : "Image description (alt text)"}
        <input
          name="altText"
          minLength={5}
          maxLength={250}
          placeholder={
            mediaType === "video"
              ? "Describe the video for staff"
              : "Describe what the image shows"
          }
          required
        />
      </label>
      <button className="button button-dark field-wide" disabled={isUploading}>
        {isUploading
          ? mediaType === "video"
            ? `Uploading video… ${progress}%`
            : "Uploading image…"
          : "Upload to media library"}
      </button>
      {mediaType === "video" && isUploading && (
        <progress
          className="media-upload-progress field-wide"
          max={100}
          value={progress}
          aria-label="Video upload progress"
        />
      )}
      {message && (
        <p
          className={isError ? "form-server-error field-wide" : "media-upload-success field-wide"}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </form>
  );
}
