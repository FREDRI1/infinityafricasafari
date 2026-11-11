export function isSupportedMp4File(file: Pick<File, "name" | "type">) {
  if (file.type === "video/mp4") return true;
  return (
    (file.type === "" || file.type === "application/octet-stream") &&
    /\.mp4$/i.test(file.name)
  );
}
