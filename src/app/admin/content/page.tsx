import type { Metadata } from "next";
import { StaffPermission, StaffRole } from "@prisma/client";
import { AdminHomepageContentForm } from "@/components/admin-homepage-content-form";
import { AdminTopbar } from "@/components/admin-topbar";
import { saveHomepageContent } from "@/app/admin/content/actions";
import { localMedia } from "@/data/media";
import { getHomepageContent } from "@/lib/homepage-content";
import { requireStaffPermission } from "@/lib/admin";
import { getPublicMediaUrl } from "@/lib/media-storage";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Website content",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const contentRoles = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.CONTENT_EDITOR,
];

export default async function AdminHomepageContentPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const staff = await requireStaffPermission(contentRoles, StaffPermission.WEBSITE_CONTENT);
  const [content, uploadedMedia, params] = await Promise.all([
    getHomepageContent(),
    prisma.media.findMany({
      where: { mimeType: { startsWith: "image/" } },
      orderBy: { createdAt: "desc" },
      select: { url: true, altText: true, category: true },
    }),
    searchParams,
  ]);

  const mediaChoices = [
    ...localMedia.map((media) => ({
      value: media.src,
      label: `${media.category} · ${media.alt}`,
      src: media.src,
    })),
    ...uploadedMedia.map((media) => ({
      value: media.url,
      label: `${media.category} · ${media.altText}`,
      src: getPublicMediaUrl(media.url),
    })),
  ];

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} permissions={staff.permissions} />
      <div className="admin-heading">
        <div>
          <span className="eyebrow">Content studio</span>
          <h1>Homepage content</h1>
          <p>Manage the featured excursions and guest reviews shown on your website.</p>
        </div>
      </div>
      {params.saved === "1" && (
        <p className="media-upload-success" role="status">
          Homepage content saved and published.
        </p>
      )}
      <AdminHomepageContentForm
        initialValues={content}
        mediaChoices={mediaChoices}
        action={saveHomepageContent}
      />
    </main>
  );
}
