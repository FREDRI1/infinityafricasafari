import { Resend } from "resend";

type BookingEmailDetails = {
  reference: string;
  customerName: string;
  customerEmail: string;
  notificationEmail?: string;
  safariTitle: string;
  travelDate: string;
  guests: number;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

export async function sendBookingEmails(details: BookingEmailDetails) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const adminEmail =
    details.notificationEmail?.trim() || process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !from || !adminEmail) {
    console.warn(
      `Booking ${details.reference} was saved, but email is not configured.`,
    );
    return "NOT_CONFIGURED" as const;
  }

  const resend = new Resend(apiKey);
  const name = escapeHtml(details.customerName);
  const reference = escapeHtml(details.reference);
  const safari = escapeHtml(details.safariTitle);
  const travelDate = escapeHtml(details.travelDate);
  const guests = String(details.guests);

  const results = await Promise.allSettled([
    resend.emails.send({
      from,
      to: details.customerEmail,
      subject: `We received your safari request · ${details.reference}`,
      html: `<p>Hello ${name},</p><p>Thank you for contacting Infinity Africa Safari. We received your request for <strong>${safari}</strong>, starting ${travelDate}, for ${guests} traveller${details.guests === 1 ? "" : "s"}.</p><p>Your reference is <strong>${reference}</strong>.</p><p>This is a request, not a confirmed booking. Our team will check availability and follow up with you. No payment has been taken.</p><p>Infinity Africa Safari</p>`,
    }),
    resend.emails.send({
      from,
      to: adminEmail,
      subject: `New safari request · ${details.reference}`,
      html: `<p>A new safari request has been received.</p><p><strong>Reference:</strong> ${reference}<br/><strong>Customer:</strong> ${name}<br/><strong>Email:</strong> ${escapeHtml(details.customerEmail)}<br/><strong>Safari:</strong> ${safari}<br/><strong>Start date:</strong> ${travelDate}<br/><strong>Travellers:</strong> ${guests}</p>`,
    }),
  ]);

  const failed = results.map(
    (result) =>
      result.status === "rejected" ||
      Boolean(result.value.error),
  );
  if (failed.some(Boolean)) {
    console.error(
      `Booking email delivery failed for ${details.reference}:`,
      failed[0] ? "customer email failed" : "customer email sent",
      failed[1] ? "admin email failed" : "admin email sent",
    );
    return failed.every(Boolean) ? ("FAILED" as const) : ("PARTIAL" as const);
  }

  return "SENT" as const;
}
