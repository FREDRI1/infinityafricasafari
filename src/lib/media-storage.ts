import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetBucketCorsCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
  type CORSRule,
} from "@aws-sdk/client-s3";

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

export async function ensureMediaUploadCors(origin: string) {
  const client = getStorageClient();
  let rules: CORSRule[] = [];
  try {
    const response = await client.send(
      new GetBucketCorsCommand({ Bucket: SITE_MEDIA_BUCKET }),
    );
    rules = response.CORSRules ?? [];
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !["NoSuchCORSConfiguration", "NotFound"].includes(error.name)
    ) {
      throw error;
    }
  }

  const hasUploadRule = rules.some(
    (rule) =>
      rule.AllowedMethods?.includes("PUT") &&
      (rule.AllowedOrigins?.includes(origin) ||
        rule.AllowedOrigins?.includes("*")) &&
      (rule.AllowedHeaders?.includes("*") ||
        (rule.AllowedHeaders?.includes("content-type") &&
          rule.AllowedHeaders?.includes("cache-control"))),
  );
  if (hasUploadRule) return;

  await client.send(
    new PutBucketCorsCommand({
      Bucket: SITE_MEDIA_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          ...rules,
          {
            AllowedOrigins: [origin],
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["content-type", "cache-control"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    }),
  );
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
