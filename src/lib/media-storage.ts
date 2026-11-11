import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const SITE_MEDIA_BUCKET = "site-media";

let client: S3Client | undefined;

function getStorageConfig() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Media storage is not configured. Add the Neon Object Storage environment variables to the application.",
    );
  }

  return { endpoint, region, accessKeyId, secretAccessKey };
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

export async function deleteMediaObject(key: string) {
  await getStorageClient().send(
    new DeleteObjectCommand({ Bucket: SITE_MEDIA_BUCKET, Key: key }),
  );
}
