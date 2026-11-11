"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { isSupportedMp4File } from "@/lib/media-upload";

type UploadResult = {
  error?: string;
  uploadUrl?: string;
  uploadToken?: string;
  headers?: Record<string, string>;
};

const maxVideoBytes = 100 * 1024 * 1024;

function uploadVideoFile(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    Object.entries(headers).forEach(([name, value]) => {
      request.setRequestHeader(name, value);
    });
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
      } else {
        reject(new Error("The video could not be uploaded to media storage."));
      }
    };
    request.onerror = () => reject(new Error("The video upload was interrupted."));
    request.onabort = () => reject(new Error("The video upload was cancelled."));
    request.send(file);
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
    const response = await fetch("/api/admin/media/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as UploadResult;
    if (!response.ok) {
      throw new Error(result.error ?? "The video could not be uploaded.");
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
        if (file.size > maxVideoBytes) {
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
        if (!prepared.uploadUrl || !prepared.uploadToken || !prepared.headers) {
          throw new Error("The upload service returned incomplete video upload details.");
        }
        uploadToken = prepared.uploadToken;
        await uploadVideoFile(prepared.uploadUrl, file, prepared.headers, setProgress);
        await postVideoAction({ action: "complete", token: uploadToken });
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
              : "image/jpeg,image/png,image/webp,image/gif"
          }
          required
        />
        <small>
          {mediaType === "video"
            ? "MP4 · maximum 100 MB · files can be selected from your computer or a mounted external drive"
            : "JPEG, PNG, WebP, or GIF · maximum 4 MB"}
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
