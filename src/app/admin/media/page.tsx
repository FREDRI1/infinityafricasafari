import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { StaffRole } from "@prisma/client";
import { AdminTopbar } from "@/components/admin-topbar";
import { localMedia } from "@/data/media";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const staff = await requireStaff([
    StaffRole.SUPER_ADMIN,
    StaffRole.ADMIN,
    StaffRole.CONTENT_EDITOR,
  ]);
  const uploadedMedia = process.env.DATABASE_URL
    ? await prisma.media.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    : [];

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Media library</span>
          <h1>Images and video</h1>
          <p>Review approved local imagery and media already stored in Cloudinary.</p>
        </div>
        <Link className="button button-outline" href="/assets/MEDIA.md" target="_blank">
          Media sources and license
        </Link>
      </div>

      <section className="media-library-section">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Project assets</span>
            <h2>Local media library</h2>
          </div>
        </div>
        <div className="admin-media-grid">
          {localMedia.map((media) => (
            <article className="admin-media-card" key={media.src}>
              <Image
                src={media.src}
                alt={media.alt}
                width={media.width}
                height={media.height}
              />
              <div>
                <span className="status-pill">{media.category}</span>
                <p>{media.alt}</p>
                <small>
                  {media.width} × {media.height} · JPEG
                </small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="media-library-section">
        <div className="admin-section-heading">
          <div>
            <span className="eyebrow">Persistent uploads</span>
            <h2>Cloudinary media</h2>
          </div>
        </div>
        {uploadedMedia.length ? (
          <div className="admin-media-grid">
            {uploadedMedia.map((media) => (
              <article className="admin-media-card" key={media.id}>
                {media.mimeType.startsWith("video/") ? (
                  <video controls preload="metadata" src={media.url}>
                    Your browser does not support embedded video.
                  </video>
                ) : (
                  <div
                    className="cloud-media-preview"
                    role="img"
                    aria-label={media.altText}
                    style={{ backgroundImage: `url("${media.url}")` }}
                  />
                )}
                <div>
                  <span className="status-pill">{media.category}</span>
                  <p>{media.altText}</p>
                  <small>
                    {media.fileName} · {(media.bytes / (1024 * 1024)).toFixed(1)} MB
                  </small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="admin-empty">
            <h2>No uploaded media yet.</h2>
            <p>
              Persistent CMS uploads require Cloudinary credentials. They are
              not stored on the application filesystem.
            </p>
          </div>
        )}
      </section>
      <p className="admin-note-small">
        Local imagery is licensed and illustrative. Check{" "}
        <Link href="/assets/MEDIA.md">the media manifest</Link> before using
        assets outside this website. No AI-generated video is included.
      </p>
    </main>
  );
}
