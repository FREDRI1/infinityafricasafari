import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export const SITE_MEDIA_BUCKET = "site-media";

let client: S3Client | undefined;

const requiredStorageEnvironment = [
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;

export function getMissingMediaStorageEnvironment() {
  return requiredStorageEnvironment.filter(
    (name) => !process.env[name]?.trim(),
  );
}

function getStorageConfig() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  const missing = getMissingMediaStorageEnvironment();
  if (
    !endpoint?.trim() ||
    !region?.trim() ||
    !accessKeyId?.trim() ||
    !secretAccessKey?.trim()
  ) {
    throw new Error(
      `Media storage is not configured. Missing environment variables: ${missing.join(", ")}.`,
    );
  }

  try {
    new URL(endpoint);
  } catch {
    throw new Error("AWS_ENDPOINT_URL_S3 must be a valid storage endpoint URL.");
  }

  return {
    endpoint: endpoint.trim(),
    region: region.trim(),
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
  };
}

function getStorageClient() {
  if (client) return client;
  const { endpoint, region, accessKeyId, secretAccessKey } = getStorageConfig();
  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function getPublicMediaUrl(key: string) {
  if (key.startsWith("/") || /^https?:\/\//i.test(key)) return key;

  const { endpoint } = getStorageConfig();
  const base = endpoint.endsWith("/") ? endpoint : `${endpoint}/`;
  return new URL(
    `${SITE_MEDIA_BUCKET}/${key
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`,
    base,
  ).toString();
}

export async function uploadMediaObject(
  key: string,
  body: Buffer,
  contentType: string,
) {
  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: SITE_MEDIA_BUCKET,
      Key: key,
      Body: body,
      ContentLength: body.length,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function createPresignedVideoUpload(key: string) {
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = getStorageClient();
  const command = new PutObjectCommand({
    Bucket: SITE_MEDIA_BUCKET,
    Key: key,
    ContentType: "video/mp4",
    CacheControl: "public, max-age=31536000, immutable",
  });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
  return {
    uploadUrl,
    headers: {
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  };
}

export async function getMediaObjectMetadata(key: string) {
  const client = getStorageClient();
  const response = await client.send(
    new HeadObjectCommand({ Bucket: SITE_MEDIA_BUCKET, Key: key }),
  );
  if ((response.ContentLength ?? 0) < 12) {
    return {
      bytes: response.ContentLength ?? 0,
      mimeType: response.ContentType ?? "",
      isMp4: false,
    };
  }
  const signature = await client.send(
    new GetObjectCommand({
      Bucket: SITE_MEDIA_BUCKET,
      Key: key,
      Range: "bytes=4-7",
    }),
  );
  const signatureBytes = await signature.Body?.transformToByteArray();
  return {
    bytes: response.ContentLength ?? 0,
    mimeType: response.ContentType ?? "",
    isMp4: Boolean(
      signatureBytes &&
        signatureBytes.length === 4 &&
        Buffer.from(signatureBytes).toString("ascii") === "ftyp",
    ),
  };
}

export async function deleteMediaObject(key: string) {
  await getStorageClient().send(
    new DeleteObjectCommand({ Bucket: SITE_MEDIA_BUCKET, Key: key }),
  );
}
