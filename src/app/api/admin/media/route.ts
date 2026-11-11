import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { auth } from "@/auth";
import {
  deleteMediaObject,
  getMissingMediaStorageEnvironment,
  uploadMediaObject,
} from "@/lib/media-storage";
import {
  getMediaUploadErrorLabel,
  maxImageUploadBytes,
  resolveSupportedImageMimeType,
} from "@/lib/media-upload";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const allowedTypes = {
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": {
    extension: "png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  "image/webp": { extension: "webp", signature: [0x52, 0x49, 0x46, 0x46] },
  "image/gif": { extension: "gif", signature: [0x47, 0x49, 0x46, 0x38] },
} as const;

const allowedCategories = new Set([
  "General",
  "Excursion",
  "Safari",
  "Destination",
]);
const contentRoles: StaffRole[] = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

function hasExpectedSignature(
  bytes: Buffer,
  mimeType: keyof typeof allowedTypes,
) {
  const { signature } = allowedTypes[mimeType];
  if (!signature.every((byte, index) => bytes[index] === byte)) return false;
  if (mimeType === "image/webp") {
    return bytes.toString("ascii", 8, 12) === "WEBP";
  }
  if (mimeType === "image/gif") {
    return bytes.length >= 6 && ["7a", "9a"].includes(bytes.toString("ascii", 4, 6));
  }
  return true;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to upload media." }, { status: 401 });
  }
  if (!contentRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "Your staff role cannot upload media." },
      { status: 403 },
    );
  }
  const staff = session.user;
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > maxImageUploadBytes + 32 * 1024) {
    return NextResponse.json(
      { error: "Images must be 4 MB or smaller." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Could not read uploaded media form data.", error);
    return NextResponse.json(
      { error: "The upload could not be read. Choose an image and try again." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const altText = formData.get("altText");
  const category = formData.get("category");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > maxImageUploadBytes) {
    return NextResponse.json(
      { error: "Images must be 4 MB or smaller." },
      { status: 413 },
    );
  }
  if (
    typeof altText !== "string" ||
    altText.trim().length < 5 ||
    altText.trim().length > 250
  ) {
    return NextResponse.json(
      { error: "Add descriptive alt text between 5 and 250 characters." },
      { status: 400 },
    );
  }
  if (typeof category !== "string" || !allowedCategories.has(category)) {
    return NextResponse.json({ error: "Choose a valid media category." }, { status: 400 });
  }

  const mimeType = resolveSupportedImageMimeType(file.name, file.type);
  if (!mimeType) {
    return NextResponse.json(
      { error: "Upload a JPEG, PNG, WebP, or GIF image." },
      { status: 415 },
    );
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    console.error("Could not read the selected image file.", error);
    return NextResponse.json(
      { error: "The selected image could not be read from its storage. Re-select it and try again." },
      { status: 400 },
    );
  }
  if (!hasExpectedSignature(bytes, mimeType)) {
    return NextResponse.json(
      { error: "The image contents do not match the selected file type." },
      { status: 415 },
    );
  }

  const key = `uploads/${randomUUID()}.${allowedTypes[mimeType].extension}`;
  let uploaded = false;
  let uploadStage = "checking storage configuration";
  try {
    const missingEnvironment = getMissingMediaStorageEnvironment();
    if (missingEnvironment.length) {
      return NextResponse.json(
        {
          error: `Image storage is not configured on the application server. Missing: ${missingEnvironment.join(", ")}.`,
        },
        { status: 503 },
      );
    }
    uploadStage = "uploading the image to Neon Object Storage";
    await uploadMediaObject(key, bytes, mimeType);
    uploaded = true;
    uploadStage = "saving the media record and audit log to the database";
    const media = await prisma.$transaction(async (transaction) => {
      const saved = await transaction.media.create({
        data: {
          url: key,
          publicId: key,
          fileName:
            file.name
              .split(/[\\/]/)
              .pop()
              ?.replace(/[\u0000-\u001f\u007f]/g, "")
              .trim()
              .slice(0, 255) || "uploaded-image",
          mimeType,
          bytes: bytes.length,
          category,
          altText: altText.trim(),
          uploadedBy: staff.id,
        },
        select: {
          id: true,
          url: true,
          fileName: true,
          mimeType: true,
          bytes: true,
          category: true,
          altText: true,
          createdAt: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: staff.id,
          action: "MEDIA_UPLOADED",
          entityType: "Media",
          entityId: saved.id,
          details: {
            fileName: saved.fileName,
            mimeType: saved.mimeType,
            bytes: saved.bytes,
            category: saved.category,
          } satisfies Prisma.InputJsonObject,
        },
      });
      return saved;
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    if (uploaded) {
      try {
        await deleteMediaObject(key);
      } catch (cleanupError) {
        console.error("Could not remove an incomplete media upload.", cleanupError);
      }
    }
    console.error("Media upload failed.", error);
    if (
      error instanceof Error &&
      (error.message.startsWith("Media storage is not configured.") ||
        error.message === "AWS_ENDPOINT_URL_S3 must be a valid storage endpoint URL.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      {
        error: `Image upload failed while ${uploadStage} (${getMediaUploadErrorLabel(error)}). Check the deployed application's Neon storage settings and database access, then retry.`,
      },
      { status: uploadStage.includes("database") ? 503 : 502 },
    );
  }
}
