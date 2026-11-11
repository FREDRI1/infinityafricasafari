"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type UploadResult = { error?: string };

export function AdminMediaUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function uploadMedia(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    setIsUploading(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: new FormData(formRef.current),
      });
      const result = (await response.json()) as UploadResult;
      if (!response.ok) {
        setIsError(true);
        setMessage(result.error ?? "The image could not be uploaded.");
        return;
      }

      formRef.current.reset();
      setMessage("Image uploaded and added to the media library.");
      router.refresh();
    } catch (error) {
      console.error("Could not connect to the media upload service.", error);
      setIsError(true);
      setMessage("Could not connect to the upload service. Check your connection and try again.");
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
      <label className="field field-wide">
        Choose image from your computer
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
        />
        <small>JPEG, PNG, WebP, or GIF · maximum 4 MB</small>
      </label>
      <label className="field">
        Category
        <select name="category" defaultValue="General">
          <option>General</option>
          <option>Excursion</option>
          <option>Safari</option>
          <option>Destination</option>
        </select>
      </label>
      <label className="field">
        Image description (alt text)
        <input
          name="altText"
          minLength={5}
          maxLength={250}
          placeholder="Describe what the image shows"
          required
        />
      </label>
      <button className="button button-dark field-wide" disabled={isUploading}>
        {isUploading ? "Uploading image…" : "Upload to media library"}
      </button>
      {message && (
        <p className={isError ? "form-server-error field-wide" : "media-upload-success field-wide"} role={isError ? "alert" : "status"}>
          {message}
        </p>
      )}
    </form>
  );
}
