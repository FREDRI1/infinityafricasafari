export const maxVideoUploadBytes = 100 * 1024 * 1024;
export const videoUploadPartBytes = 8 * 1024 * 1024;

export function isSupportedMp4File(file: Pick<File, "name" | "type">) {
  if (file.type === "video/mp4") return true;
  return (
    (file.type === "" || file.type === "application/octet-stream") &&
    /\.mp4$/i.test(file.name)
  );
}

export function getVideoUploadPartCount(bytes: number) {
  return Math.ceil(bytes / videoUploadPartBytes);
}
