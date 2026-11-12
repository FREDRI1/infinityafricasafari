# Infinity Africa Safari

Premium safari discovery and assisted booking platform built with Next.js, strict TypeScript, Tailwind CSS, Prisma and PostgreSQL.

## What is implemented

- Responsive public homepage, safari catalogue and individual journey pages.
- Destination search and safari filtering.
- Assisted booking request form with server-side validation, unique references and idempotent submissions.
- Database-backed booking request throttling keyed by a secret hash of the trusted proxy IP.
- PostgreSQL booking, customer, payment, history and audit models.
- Confirmation email and administrator notification through Resend when configured.
- Private staff sign-in and role-guarded booking dashboard.
- Super-admin staff account and role management, including account deactivation and audit history.
- Booking operations settings for accepting requests and routing staff notification email.
- Role-guarded safari and destination management, itinerary editing, and archive workflows.
- Persistent media uploads to Neon Object Storage and a role-protected media library.
- Public marketplace click analytics with country-level reporting and no stored visitor identifiers.
- Homepage excursion and guest review content managed in the admin website-content editor.
- Homepage hero image, slideshow, video mode, and overlay copy managed in Settings.
- Company name, tagline, website logo, and browser icon managed in admin brand settings.
- Booking search, status history, customer communication notes and WhatsApp hand-off links.
- Manually recorded payments remain unverified until an authorized administrator verifies them.
- Sample itinerary concepts and licensed illustrative Unsplash photography; no actual prices or business contact details are assumed.

## Local setup

Requirements: Node.js 20.9+, npm, and a PostgreSQL database (Neon is supported).

1. Copy `.env.example` to `.env` and fill in the values for your services.
2. Set `DATABASE_URL` to Neon’s pooled connection string and `DIRECT_URL` to its direct connection string.
3. Generate an authentication secret with `npx auth secret`; set it as `AUTH_SECRET`.
4. Install packages with `npm install`.
5. Generate Prisma Client with `npm run db:generate`.
6. Apply migrations with `npm run db:migrate`.
7. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`, then run `npm run db:seed` to create the first staff account and starter content.
8. Start the app with `npm run dev`.

The public safari ideas are explicitly illustrative starter content. Production CMS content should be reviewed and published by authorized staff. Booking submission requires a configured database. Email delivery additionally requires a verified Resend sender (`EMAIL_FROM`), `RESEND_API_KEY`, and `ADMIN_NOTIFICATION_EMAIL`.

## Deploying with Vercel

Import the GitHub repository into Vercel as a Next.js project. Keep the default install and build commands; `postinstall` generates Prisma Client during dependency installation.

Add these environment variables to the Vercel Production environment:

- `DATABASE_URL`: Neon pooled connection string for application traffic.
- `DIRECT_URL`: Neon direct (unpooled) connection string, used by Prisma.
- `AUTH_SECRET`: the Auth.js secret.
- `NEXT_PUBLIC_SITE_URL`: the canonical HTTPS deployment URL.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, and `AWS_REGION`: Neon Object Storage credentials for the production branch. Keep these server-only; never use the `NEXT_PUBLIC_` prefix.

Set `AUTH_URL` to the canonical HTTPS deployment URL if Auth.js does not detect it automatically. Optional email and WhatsApp integrations use `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`, and `NEXT_PUBLIC_WHATSAPP_NUMBER`. Do not upload `.env` wholesale: it contains local-only values and credentials that should not be exposed. The initial admin account and database content are seeded separately and do not require `ADMIN_PASSWORD` on Vercel.

After adding or changing Prisma migrations, apply them deliberately to the intended Neon branch with `npm run db:migrate`; do not run migrations as an automatic build step.

The public click tracker records element labels, destination paths, timestamps, and Vercel country codes. It does not persist visitor IP addresses or unique visitor identifiers. The endpoint applies request validation and per-instance rate limiting; configure Vercel Firewall rate limits for additional protection at the edge.

## Data and payment rules

Customers submit requests; they do not pay online. Staff personally check availability, agree a final amount and currency, record any payment received outside the site, and verify it separately. The application stores monetary values as PostgreSQL `Decimal` and snapshots customer and safari details at request time.

## Quality checks

```powershell
npm run typecheck
npm run lint
npm run db:validate
npm run build
```

Run `npm run test` for booking, pricing, homepage content, brand settings, and marketplace click tests. Database-backed flows require valid service configuration to test end-to-end.

## Media

Image provenance, intended usage and licensing notes are in [`public/assets/MEDIA.md`](public/assets/MEDIA.md). Staff with content access can upload JPEG, PNG, WebP, or GIF images up to 4 MB and MP4 videos up to 100 MB from Admin → Media library. Images and videos are stored in the production branch's public-read `site-media` bucket; uploaded images can be selected for website content and brand identity, and uploaded videos can be selected for the homepage hero. Upload only media you own or are licensed to use.
