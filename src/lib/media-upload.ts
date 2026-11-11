export const maxVideoUploadBytes = 100 * 1024 * 1024;
export const videoUploadPartBytes = 8 * 1024 * 1024;
export const maxImageUploadBytes = 4 * 1024 * 1024;

const imageExtensions = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
} as const;

export type SupportedImageMimeType =
  (typeof imageExtensions)[keyof typeof imageExtensions];

const supportedImageMimeTypes = new Set<SupportedImageMimeType>(
  Object.values(imageExtensions),
);

export function resolveSupportedImageMimeType(
  fileName: string,
  reportedMimeType: string,
): SupportedImageMimeType | null {
  const mimeType = reportedMimeType.trim().toLowerCase().split(";")[0];
  if (supportedImageMimeTypes.has(mimeType as SupportedImageMimeType)) {
    return mimeType as SupportedImageMimeType;
  }
  if (mimeType && mimeType !== "application/octet-stream") return null;

  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && Object.hasOwn(imageExtensions, extension)
    ? imageExtensions[extension as keyof typeof imageExtensions]
    : null;
}

export function getMediaUploadErrorLabel(error: unknown) {
  if (typeof error !== "object" || error === null) return "UnknownError";

  const record = error as Record<string, unknown>;
  const cause =
    typeof record.cause === "object" && record.cause !== null
      ? (record.cause as Record<string, unknown>)
      : undefined;
  const errorCode =
    typeof record.code === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(record.code)
      ? record.code
      : typeof cause?.code === "string" &&
          /^[A-Za-z0-9_-]{1,40}$/.test(cause.code)
        ? cause.code
        : undefined;
  const prismaCode =
    record.name === "PrismaClientKnownRequestError" &&
    typeof record.code === "string"
      ? record.code
      : undefined;
  const metadata =
    typeof record.$metadata === "object" && record.$metadata !== null
      ? (record.$metadata as Record<string, unknown>)
      : undefined;
  const status =
    typeof metadata?.httpStatusCode === "number"
      ? metadata.httpStatusCode
      : undefined;
  const name =
    typeof record.name === "string" &&
    /^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(record.name)
      ? record.name
      : "UnknownError";
  const label = prismaCode ?? errorCode ?? name;
  return status ? `${label}, HTTP ${status}` : label;
}

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
