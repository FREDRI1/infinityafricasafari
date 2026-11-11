import assert from "node:assert/strict";
import test from "node:test";
import {
  getMediaUploadErrorLabel,
  getVideoUploadPartCount,
  isSupportedMp4File,
  maxVideoUploadBytes,
  resolveSupportedImageMimeType,
  videoUploadPartBytes,
} from "../src/lib/media-upload";

test("resolves supported images from mounted drives with missing or generic MIME types", () => {
  assert.equal(resolveSupportedImageMimeType("elephants.webp", ""), "image/webp");
  assert.equal(
    resolveSupportedImageMimeType("elephants.JPG", "application/octet-stream"),
    "image/jpeg",
  );
  assert.equal(resolveSupportedImageMimeType("elephants.gif", "image/gif"), "image/gif");
  assert.equal(resolveSupportedImageMimeType("elephants.png", "application/pdf"), null);
  assert.equal(resolveSupportedImageMimeType("elephants.heic", ""), null);
});

test("reports safe storage and database error identifiers", () => {
  assert.equal(
    getMediaUploadErrorLabel({
      name: "PrismaClientKnownRequestError",
      code: "P2021",
    }),
    "P2021",
  );
  assert.equal(
    getMediaUploadErrorLabel({
      name: "Error",
      cause: { code: "ECONNRESET" },
    }),
    "ECONNRESET",
  );
});

test("accepts MP4 files selected from storage providers with a reported MP4 MIME type", () => {
  assert.equal(
    isSupportedMp4File({ name: "safari.mp4", type: "video/mp4" }),
    true,
  );
});

test("accepts an MP4 extension when a mounted drive does not provide a MIME type", () => {
  assert.equal(isSupportedMp4File({ name: "safari.mp4", type: "" }), true);
  assert.equal(
    isSupportedMp4File({
      name: "safari.MP4",
      type: "application/octet-stream",
    }),
    true,
  );
});

test("does not accept files with a non-MP4 extension or unrelated MIME type", () => {
  assert.equal(isSupportedMp4File({ name: "safari.mov", type: "" }), false);
  assert.equal(
    isSupportedMp4File({ name: "safari.mp4", type: "video/quicktime" }),
    false,
  );
});

test("splits large videos into bounded, ordered multipart chunks", () => {
  assert.equal(getVideoUploadPartCount(1), 1);
  assert.equal(getVideoUploadPartCount(videoUploadPartBytes), 1);
  assert.equal(getVideoUploadPartCount(videoUploadPartBytes + 1), 2);
  assert.equal(getVideoUploadPartCount(maxVideoUploadBytes), 13);
});
