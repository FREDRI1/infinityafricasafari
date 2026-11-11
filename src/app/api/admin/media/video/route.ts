import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import {
  abortMultipartVideoUpload,
  beginMultipartVideoUpload,
  completeMultipartVideoUpload,
  createPresignedVideoPartUpload,
  deleteMediaObject,
  getMediaObjectMetadata,
  getMissingMediaStorageEnvironment,
} from "@/lib/media-storage";
import { getVideoUploadPartCount } from "@/lib/media-upload";
import {
  createVideoUploadToken,
  verifyVideoUploadToken,
} from "@/lib/media-upload-token";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const contentRoles: StaffRole[] = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];
const allowedCategories = new Set([
  "General",
  "Excursion",
  "Safari",
  "Destination",
  "Video",
]);
const prepareSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  bytes: z.number().int().positive().max(100 * 1024 * 1024),
  mimeType: z.enum(["video/mp4", "", "application/octet-stream"]),
  altText: z.string().trim().min(5).max(250),
  category: z.string().refine((value) => allowedCategories.has(value)),
});
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("prepare"), metadata: prepareSchema }),
  z.object({
    action: z.literal("sign-part"),
    token: z.string().min(1).max(4096),
    partNumber: z.number().int().positive().max(13),
  }),
  z.object({
    action: z.literal("complete"),
    token: z.string().min(1).max(4096),
    parts: z.array(
      z.object({
        partNumber: z.number().int().positive().max(13),
        etag: z.string().trim().min(1).max(256),
      }),
    ).min(1).max(13),
  }),
  z.object({
    action: z.literal("cancel"),
    token: z.string().min(1).max(4096),
  }),
]);

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

async function getAuthorizedStaff(request: Request) {
  if (!isSameOrigin(request)) {
    return {
      response: NextResponse.json(
        { error: "Request origin is not allowed." },
        { status: 403 },
      ),
    };
  }
  const session = await auth();
  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: "Sign in to upload media." },
        { status: 401 },
      ),
    };
  }
  if (!contentRoles.includes(session.user.role)) {
    return {
      response: NextResponse.json(
        { error: "Your staff role cannot upload media." },
        { status: 403 },
      ),
    };
  }
  return { staff: session.user };
}

function safeFileName(value: string) {
  return (
    value
      .split(/[\\/]/)
      .pop()
      ?.replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 255) || "uploaded-video.mp4"
  );
}

export async function POST(request: Request) {
  const authorization = await getAuthorizedStaff(request);
  if (authorization.response) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Could not read video upload request.", error);
    return NextResponse.json(
      { error: "The video upload request could not be read." },
      { status: 400 },
    );
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid video upload request." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "prepare") {
    const metadata = parsed.data.metadata;
    const key = `uploads/${randomUUID()}.mp4`;
    let uploadStage = "checking storage configuration";
    let uploadId: string | undefined;
    try {
      const missingEnvironment = getMissingMediaStorageEnvironment();
      if (missingEnvironment.length) {
        return NextResponse.json(
          {
            error: `Video storage is not configured on the application server. Missing: ${missingEnvironment.join(", ")}.`,
          },
          { status: 503 },
        );
      }
      uploadStage = "starting a resumable media upload";
      uploadId = await beginMultipartVideoUpload(key);
      const token = createVideoUploadToken({
        key,
        uploadId,
        fileName: safeFileName(metadata.fileName),
        bytes: metadata.bytes,
        category: metadata.category,
        altText: metadata.altText,
        userId: authorization.staff.id,
      });
      return NextResponse.json({
        uploadToken: token,
        partSize: 8 * 1024 * 1024,
        partCount: getVideoUploadPartCount(metadata.bytes),
      });
    } catch (error) {
      console.error("Could not prepare direct video upload.", error);
      if (uploadId) {
        try {
          await abortMultipartVideoUpload(key, uploadId);
        } catch (cleanupError) {
          console.error("Could not clean up an unprepared multipart video upload.", cleanupError);
        }
      }
      if (error instanceof Error && error.name === "NoSuchBucket") {
        return NextResponse.json(
          { error: "The configured video media bucket is unavailable. Check the Neon storage bucket setup." },
          { status: 503 },
        );
      }
      if (
        error instanceof Error &&
        ["AccessDenied", "InvalidAccessKeyId", "SignatureDoesNotMatch"].includes(error.name)
      ) {
        return NextResponse.json(
          { error: "The application server cannot access video storage. Check that its Neon storage credentials are valid and include storage write access." },
          { status: 503 },
        );
      }
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const status =
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        typeof error.$metadata === "object" &&
        error.$metadata !== null &&
        "httpStatusCode" in error.$metadata &&
        typeof error.$metadata.httpStatusCode === "number"
          ? `, HTTP ${error.$metadata.httpStatusCode}`
          : "";
      return NextResponse.json(
        {
          error: `Video upload setup failed while ${uploadStage} (${errorName}${status}). Check the application server's Neon storage endpoint, credentials, and site-media bucket permissions.`,
        },
        { status: 503 },
      );
    }
  }

  const metadata = verifyVideoUploadToken(parsed.data.token);
  if (!metadata || metadata.userId !== authorization.staff.id) {
    return NextResponse.json(
      { error: "This upload has expired or is not valid for your account. Start again." },
      { status: 400 },
    );
  }

  if (parsed.data.action === "sign-part") {
    const partCount = getVideoUploadPartCount(metadata.bytes);
    if (parsed.data.partNumber > partCount) {
      return NextResponse.json(
        { error: "The requested video part is outside this upload." },
        { status: 400 },
      );
    }
    try {
      const uploadUrl = await createPresignedVideoPartUpload(
        metadata.key,
        metadata.uploadId,
        parsed.data.partNumber,
      );
      return NextResponse.json({ uploadUrl });
    } catch (error) {
      console.error("Could not sign a video upload part.", error);
      return NextResponse.json(
        { error: "A secure upload link could not be created for this video part. Retry the upload." },
        { status: 503 },
      );
    }
  }

  if (parsed.data.action === "cancel") {
    const existing = await prisma.media.findUnique({
      where: { publicId: metadata.key },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "The completed media item cannot be cancelled." },
        { status: 409 },
      );
    }
    try {
      await abortMultipartVideoUpload(metadata.key, metadata.uploadId);
      return NextResponse.json({ cancelled: true });
    } catch (error) {
      console.error("Could not clean up incomplete video upload.", error);
      return NextResponse.json(
        { error: "The incomplete upload could not be cleaned up." },
        { status: 500 },
      );
    }
  }

  const existing = await prisma.media.findUnique({
    where: { publicId: metadata.key },
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
  if (existing) return NextResponse.json({ media: existing });

  try {
    const expectedPartCount = getVideoUploadPartCount(metadata.bytes);
    const parts = parsed.data.parts;
    if (
      parts.length !== expectedPartCount ||
      new Set(parts.map((part) => part.partNumber)).size !== expectedPartCount ||
      parts.some((part, index) => part.partNumber !== index + 1)
    ) {
      return NextResponse.json(
        { error: "The video upload is incomplete. Please retry the missing parts." },
        { status: 400 },
      );
    }
    await completeMultipartVideoUpload(
      metadata.key,
      metadata.uploadId,
      parts.map(({ partNumber, etag }) => ({
        PartNumber: partNumber,
        ETag: etag,
      })),
    );
    const uploaded = await getMediaObjectMetadata(metadata.key);
    if (
      uploaded.bytes !== metadata.bytes ||
      uploaded.mimeType.split(";")[0] !== "video/mp4" ||
      !uploaded.isMp4
    ) {
      await deleteMediaObject(metadata.key);
      return NextResponse.json(
        { error: "The upload must be a valid MP4 file with the expected size." },
        { status: 400 },
      );
    }

    const media = await prisma.$transaction(async (transaction) => {
      const saved = await transaction.media.create({
        data: {
          url: metadata.key,
          publicId: metadata.key,
          fileName: metadata.fileName,
          mimeType: "video/mp4",
          bytes: uploaded.bytes,
          category: metadata.category,
          altText: metadata.altText,
          uploadedBy: authorization.staff.id,
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
          actorId: authorization.staff.id,
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
    console.error("Could not save uploaded video metadata.", error);
    const completed = await prisma.media.findUnique({
      where: { publicId: metadata.key },
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
    if (completed) return NextResponse.json({ media: completed });
    try {
      await deleteMediaObject(metadata.key);
    } catch (cleanupError) {
      console.error("Could not clean up video after metadata save failure.", cleanupError);
    }
    return NextResponse.json(
      { error: "The video uploaded but could not be saved to the media library." },
      { status: 500 },
    );
  }
}
