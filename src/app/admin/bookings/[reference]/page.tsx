import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatus, PaymentType, Prisma, StaffRole } from "@prisma/client";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin-topbar";
import { ConfirmActionForm } from "@/components/confirm-action-form";
import { bookingStaffRoles, requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import {
  logCustomerCommunication,
  recordManualPayment,
  saveAgreedAmount,
  updateBookingStatus,
  verifyManualPayment,
} from "@/app/admin/bookings/actions";

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ updated?: string }>;
};

export const metadata: Metadata = {
  title: "Booking details",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function getSnapshotTitle(snapshot: Prisma.JsonValue) {
  if (
    typeof snapshot === "object" &&
    snapshot !== null &&
    "title" in snapshot &&
    typeof snapshot.title === "string"
  ) {
    return snapshot.title;
  }
  return "Safari request";
}

function whatsappLink(phone: string, customerName: string, reference: string, safari: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;

  const message = `Hello ${customerName},\n\nThank you for choosing Infinity Africa Safari. We have received your safari request ${reference} for ${safari}. Our team would be happy to discuss availability and your plans.\n\nInfinity Africa Safari Team`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default async function AdminBookingDetailPage({
  params,
  searchParams,
}: Props) {
  const staff = await requireStaff(bookingStaffRoles);
  const [{ reference }, { updated }] = await Promise.all([params, searchParams]);
  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: {
      customer: true,
      assignedStaff: { select: { name: true, email: true } },
      payments: {
        orderBy: { createdAt: "desc" },
        include: { verifiedBy: { select: { name: true, email: true } } },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, email: true } } },
      },
      communications: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  const safariTitle = getSnapshotTitle(booking.safariSnapshot);
  const verifiedPayments = booking.payments.filter((payment) => payment.verified);
  const amountPaid = verifiedPayments.reduce(
    (total, payment) => total.plus(payment.amount),
    new Prisma.Decimal(0),
  );
  const balance =
    booking.agreedAmount?.minus(amountPaid) ?? null;
  const contactNumber = booking.customer.whatsapp || booking.customer.phone;
  const whatsApp = whatsappLink(
    contactNumber,
    booking.customer.fullName,
    booking.reference,
    safariTitle,
  );
  const customerWhatsApp = booking.customer.whatsapp
    ? whatsappLink(
        booking.customer.whatsapp,
        booking.customer.fullName,
        booking.reference,
        safariTitle,
      )
    : null;
  const canVerifyPayments =
    staff.role === StaffRole.SUPER_ADMIN || staff.role === StaffRole.ADMIN;

  return (
    <main className="admin-shell page-width">
      <AdminTopbar role={staff.role} />
      <Link className="back-link admin-back-link" href="/admin/bookings">
        <ArrowLeft size={15} aria-hidden="true" /> All booking requests
      </Link>
      <div className="admin-heading booking-admin-heading">
        <div>
          <span className="eyebrow">Booking request</span>
          <h1>{booking.reference}</h1>
          <p>
            Received{" "}
            {booking.createdAt.toLocaleString("en", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <span className="status-pill status-pill-large">
          {booking.status.replaceAll("_", " ")}
        </span>
      </div>

      {updated && (
        <p className="admin-success" role="status">
          <Check size={16} aria-hidden="true" />
          Update saved.
        </p>
      )}

      <div className="booking-admin-grid">
        <div className="booking-admin-main">
          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">Customer</span>
                <h2>{booking.customer.fullName}</h2>
              </div>
            </div>
            <div className="customer-contact-grid">
              <div>
                <span>Email</span>
                <a href={`mailto:${booking.customer.email}`}>
                  <Mail size={15} aria-hidden="true" />
                  {booking.customer.email}
                </a>
              </div>
              <div>
                <span>Phone</span>
                <a href={`tel:${booking.customer.phone}`}>
                  <Phone size={15} aria-hidden="true" />
                  {booking.customer.phone}
                </a>
              </div>
              {booking.customer.whatsapp && customerWhatsApp && (
                <div>
                  <span>WhatsApp</span>
                  <a
                    href={customerWhatsApp}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={15} aria-hidden="true" />
                    {booking.customer.whatsapp}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              )}
              {whatsApp && (
                <div className="whatsapp-action">
                  <span>Quick message</span>
                  <a href={whatsApp} target="_blank" rel="noreferrer">
                    <MessageCircle size={15} aria-hidden="true" />
                    Contact on WhatsApp
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </div>
              )}
              <div>
                <span>Residence</span>
                <strong>{booking.customer.countryOfResidence || "Not provided"}</strong>
              </div>
              <div>
                <span>Preferred contact</span>
                <strong>{booking.preferredCommunication.toLowerCase()}</strong>
              </div>
            </div>
          </section>

          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">Travel details</span>
                <h2>{safariTitle}</h2>
              </div>
            </div>
            <dl className="admin-detail-list">
              <div>
                <dt>Preferred travel date</dt>
                <dd>
                  {booking.travelStart.toLocaleDateString("en", {
                    dateStyle: "long",
                    timeZone: "UTC",
                  })}
                </dd>
              </div>
              <div>
                <dt>Travellers</dt>
                <dd>
                  {booking.adults} adult{booking.adults === 1 ? "" : "s"}
                  {booking.children
                    ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Rooms</dt>
                <dd>{booking.rooms}</dd>
              </div>
              <div>
                <dt>Accommodation</dt>
                <dd>{booking.accommodationPreference || "To be discussed"}</dd>
              </div>
              <div className="admin-detail-wide">
                <dt>Special requirements</dt>
                <dd>{booking.specialRequirements || "None provided"}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">Manual payments</span>
                <h2>Payment records</h2>
              </div>
              <span className="payment-total">
                Received {booking.currency ? `${booking.currency} ` : ""}
                {amountPaid.toFixed(2)}
              </span>
            </div>
            <div className="payment-balance-grid">
              <div>
                <span>Agreed amount</span>
                <strong>
                  {booking.agreedAmount && booking.currency
                    ? `${booking.currency} ${booking.agreedAmount.toFixed(2)}`
                    : "Not set"}
                </strong>
              </div>
              <div>
                <span>Verified payments</span>
                <strong>
                  {booking.currency ? `${booking.currency} ` : ""}
                  {amountPaid.toFixed(2)}
                </strong>
              </div>
              <div>
                <span>Outstanding balance</span>
                <strong>
                  {balance && booking.currency
                    ? `${booking.currency} ${balance.toFixed(2)}`
                    : "Not available"}
                </strong>
              </div>
            </div>
            {booking.payments.length ? (
              <div className="payment-record-list">
                {booking.payments.map((payment) => (
                  <article className="payment-record" key={payment.id}>
                    <div className="payment-record-heading">
                      <strong>
                        {payment.currency} {payment.amount.toFixed(2)}
                      </strong>
                      <span
                        className={
                          payment.verified ? "status-pill" : "status-pill status-pending"
                        }
                      >
                        {payment.verified ? "VERIFIED" : "UNVERIFIED"}
                      </span>
                    </div>
                    <p>
                      {payment.type.replaceAll("_", " ")} via {payment.method} ·{" "}
                      {payment.paymentDate.toLocaleDateString("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      })}
                    </p>
                    {payment.transactionRef && (
                      <p>Reference: {payment.transactionRef}</p>
                    )}
                    {payment.verified && (
                      <p>
                        Verified by{" "}
                        {payment.verifiedBy?.name ??
                          payment.verifiedBy?.email ??
                          "authorized staff"}
                      </p>
                    )}
                    {!payment.verified && canVerifyPayments && (
                      <ConfirmActionForm
                        action={verifyManualPayment.bind(null, payment.id)}
                        confirmation="Verify this payment receipt? The booking balance will update."
                        buttonLabel="Verify receipt"
                        className="button button-outline button-small"
                      />
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-muted">No manual payments have been recorded.</p>
            )}

            <details className="admin-form-disclosure">
              <summary>Set or update the agreed booking amount</summary>
              <form action={saveAgreedAmount.bind(null, booking.id)}>
                <label className="field">
                  Agreed amount
                  <input
                    name="amount"
                    inputMode="decimal"
                    defaultValue={booking.agreedAmount?.toFixed(2) ?? ""}
                    placeholder="e.g. 2500.00"
                    required
                  />
                </label>
                <label className="field">
                  Currency code
                  <input
                    name="currency"
                    defaultValue={booking.currency ?? ""}
                    placeholder="e.g. USD"
                    maxLength={3}
                    required
                  />
                </label>
                <button className="button button-dark button-small">
                  Save agreed amount
                </button>
              </form>
            </details>

            {booking.agreedAmount && booking.currency && (
              <details className="admin-form-disclosure">
                <summary>Record a manual payment</summary>
                <form action={recordManualPayment.bind(null, booking.id)}>
                  <label className="field">
                    Amount ({booking.currency})
                    <input
                      name="amount"
                      inputMode="decimal"
                      placeholder="e.g. 500.00"
                      required
                    />
                  </label>
                  <label className="field">
                    Payment type
                    <select name="type" required>
                      {Object.values(PaymentType).map((type) => (
                        <option value={type} key={type}>
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Payment method
                    <input name="method" maxLength={60} required />
                  </label>
                  <label className="field">
                    Payment date
                    <input
                      name="paymentDate"
                      type="date"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </label>
                  <label className="field field-wide">
                    External transaction reference <span className="field-optional">Optional</span>
                    <input name="transactionRef" maxLength={120} />
                  </label>
                  <label className="field field-wide">
                    Internal notes <span className="field-optional">Optional</span>
                    <textarea name="notes" rows={3} maxLength={1000} />
                  </label>
                  <p className="admin-warning">
                    This creates an unverified record. An authorized
                    administrator must verify it separately.
                  </p>
                  <button className="button button-dark button-small">
                    Record as unverified
                  </button>
                </form>
              </details>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">Customer care</span>
                <h2>Communication history</h2>
              </div>
            </div>
            {booking.communications.length ? (
              <div className="timeline">
                {booking.communications.map((entry) => (
                  <article className="timeline-item" key={entry.id}>
                    <strong>
                      {entry.channel} · {entry.direction}
                    </strong>
                    <p>{entry.summary}</p>
                    <span>
                      {entry.createdAt.toLocaleString("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="admin-muted">No communication has been logged yet.</p>
            )}
            <details className="admin-form-disclosure">
              <summary>Add a communication note</summary>
              <form action={logCustomerCommunication.bind(null, booking.id)}>
                <label className="field">
                  Channel
                  <select name="channel" required>
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PHONE">Phone</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="field">
                  Direction
                  <select name="direction" required>
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                  </select>
                </label>
                <label className="field field-wide">
                  Summary
                  <textarea name="summary" rows={4} maxLength={2000} required />
                </label>
                <button className="button button-dark button-small">
                  Save communication note
                </button>
              </form>
            </details>
          </section>

          <section className="admin-panel">
            <div className="admin-section-heading">
              <div>
                <span className="eyebrow">Audit trail</span>
                <h2>Status history</h2>
              </div>
            </div>
            <div className="timeline">
              {booking.statusHistory.map((entry) => (
                <article className="timeline-item" key={entry.id}>
                  <strong>
                    {entry.previousStatus
                      ? `${entry.previousStatus.replaceAll("_", " ")} → `
                      : ""}
                    {entry.newStatus.replaceAll("_", " ")}
                  </strong>
                  <p>{entry.reason ?? "Status recorded"}</p>
                  <span>
                    {entry.actor?.name ?? entry.actor?.email ?? "System"} ·{" "}
                    {entry.createdAt.toLocaleString("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </article>
              ))}
            </div>
            <details className="admin-form-disclosure">
              <summary>Update request status</summary>
              <form action={updateBookingStatus.bind(null, booking.id)}>
                <label className="field">
                  New status
                  <select name="status" defaultValue={booking.status} required>
                    {Object.values(BookingStatus).map((status) => (
                      <option value={status} key={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field field-wide">
                  Reason for this change
                  <textarea name="reason" rows={3} maxLength={500} required />
                </label>
                <button className="button button-dark button-small">
                  Save status change
                </button>
              </form>
            </details>
          </section>
        </div>

        <aside className="booking-admin-aside">
          <span className="eyebrow">Request status</span>
          <p>
            Request status is operational only; availability is never
            auto-confirmed.
          </p>
          {booking.agreedAmount && booking.currency && (
            <p>
              Agreed amount: <strong>{booking.currency} {booking.agreedAmount.toFixed(2)}</strong>
            </p>
          )}
          {booking.assignedStaff && (
            <p>
              Assigned to:{" "}
              <strong>{booking.assignedStaff.name ?? booking.assignedStaff.email}</strong>
            </p>
          )}
          <Link className="text-link" href="/admin/bookings">
            Back to requests
          </Link>
        </aside>
      </div>
    </main>
  );
}
