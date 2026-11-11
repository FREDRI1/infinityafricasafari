import assert from "node:assert/strict";
import test from "node:test";
import {
  createVideoUploadToken,
  verifyVideoUploadToken,
} from "../src/lib/media-upload-token";

test("video upload tokens are signed and scoped to their uploader", () => {
  const originalSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "test-secret-for-upload-token";
  try {
    const token = createVideoUploadToken({
      key: "uploads/1a2b3c4d-1234-1234-1234-123456789abc.mp4",
      uploadId: "multipart-upload-id",
      fileName: "safari.mp4",
      bytes: 1024,
      category: "Video",
      altText: "Safari sunset background video",
      userId: "staff-user-id",
    });

    assert.equal(verifyVideoUploadToken(token)?.userId, "staff-user-id");
    assert.equal(verifyVideoUploadToken(token)?.uploadId, "multipart-upload-id");
    assert.equal(verifyVideoUploadToken(`${token}tampered`), null);
  } finally {
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  }
});
