import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const uploadTokenSchema = z.object({
  key: z.string().regex(/^uploads\/[a-f0-9-]+\.mp4$/i),
  fileName: z.string().min(1).max(255),
  bytes: z.number().int().positive().max(100 * 1024 * 1024),
  category: z.string().min(1).max(40),
  altText: z.string().min(5).max(250),
  userId: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

export type VideoUploadMetadata = z.infer<typeof uploadTokenSchema>;

function getSigningSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be configured for media uploads.");
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest();
}

export function createVideoUploadToken(
  input: Omit<VideoUploadMetadata, "expiresAt">,
) {
  const metadata = uploadTokenSchema.parse({
    ...input,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });
  const payload = Buffer.from(JSON.stringify(metadata)).toString("base64url");
  return `${payload}.${sign(payload).toString("base64url")}`;
}

export function verifyVideoUploadToken(token: string): VideoUploadMetadata | null {
  const [payload, encodedSignature, ...extra] = token.split(".");
  if (!payload || !encodedSignature || extra.length) return null;

  const suppliedSignature = Buffer.from(encodedSignature, "base64url");
  const expectedSignature = sign(payload);
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const parsed = uploadTokenSchema.safeParse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (!parsed.success || parsed.data.expiresAt < Date.now()) return null;
    return parsed.data;
  } catch {
    return null;
  }
}
