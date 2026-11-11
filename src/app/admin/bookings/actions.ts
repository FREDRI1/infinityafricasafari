"use server";

import {
  BookingStatus,
  PaymentType,
  Prisma,
  StaffRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { bookingStaffRoles, requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().trim().min(3).max(500),
});

const moneySchema = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/, "Enter an amount with up to two decimals.")
  .refine((value) => {
    const [whole, fraction = ""] = value.split(".");
    return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0")) > BigInt(0);
  }, "Amount must be greater than zero.");

const currencySchema = z.string().regex(/^[A-Z]{3}$/, "Use a three-letter currency code.");

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function detailPath(reference: string) {
  return `/admin/bookings/${encodeURIComponent(reference)}`;
}

export async function updateBookingStatus(
  bookingId: string,
  formData: FormData,
) {
  const actor = await requireStaff(bookingStaffRoles);
  const parsed = statusSchema.safeParse({
    status: formValue(formData, "status"),
    reason: formValue(formData, "reason"),
  });
  if (!parsed.success) throw new Error("Choose a valid status and enter a reason.");

  const booking = await prisma.$transaction(async (transaction) => {
    const current = await transaction.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, reference: true, status: true },
    });
    if (!current) throw new Error("Booking request was not found.");
    if (current.status === parsed.data.status) {
      throw new Error("Choose a different booking status.");
    }

    const updated = await transaction.booking.updateMany({
      where: { id: current.id, status: current.status },
      data: { status: parsed.data.status },
    });
    if (updated.count !== 1) {
      throw new Error("The booking changed. Refresh and try again.");
    }

    await transaction.bookingStatusHistory.create({
      data: {
        bookingId: current.id,
        previousStatus: current.status,
        newStatus: parsed.data.status,
        actorId: actor.id,
        reason: parsed.data.reason,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "BOOKING_STATUS_CHANGED",
        entityType: "Booking",
        entityId: current.id,
        details: {
          previousStatus: current.status,
          newStatus: parsed.data.status,
          reason: parsed.data.reason,
        },
      },
    });
    return current;
  });

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(detailPath(booking.reference));
  redirect(`${detailPath(booking.reference)}?updated=status`);
}

export async function saveAgreedAmount(
  bookingId: string,
  formData: FormData,
) {
  const actor = await requireStaff(bookingStaffRoles);
  const parsedAmount = moneySchema.safeParse(formValue(formData, "amount"));
  const parsedCurrency = currencySchema.safeParse(
    formValue(formData, "currency").toUpperCase(),
  );
  if (!parsedAmount.success || !parsedCurrency.success) {
    throw new Error("Enter a valid agreed amount and three-letter currency.");
  }

  const booking = await prisma.$transaction(async (transaction) => {
    const current = await transaction.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        currency: true,
        payments: {
          select: { currency: true, amount: true, verified: true },
        },
      },
    });
    if (!current) throw new Error("Booking request was not found.");

    if (
      current.payments.some(
        (payment) => payment.currency !== parsedCurrency.data,
      )
    ) {
      throw new Error("The currency cannot change after a payment record exists.");
    }

    const agreedAmount = new Prisma.Decimal(parsedAmount.data);
    const verifiedTotal = current.payments
      .filter((payment) => payment.verified)
      .reduce(
        (total, payment) => total.plus(payment.amount),
        new Prisma.Decimal(0),
      );
    if (agreedAmount.lessThan(verifiedTotal)) {
      throw new Error("Agreed amount cannot be lower than verified payments.");
    }

    await transaction.booking.update({
      where: { id: bookingId },
      data: { agreedAmount, currency: parsedCurrency.data },
    });
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "BOOKING_AMOUNT_SET",
        entityType: "Booking",
        entityId: bookingId,
        details: {
          amount: agreedAmount.toFixed(2),
          currency: parsedCurrency.data,
        },
      },
    });
    return current;
  });

  revalidatePath(detailPath(booking.reference));
  redirect(`${detailPath(booking.reference)}?updated=amount`);
}

export async function recordManualPayment(
  bookingId: string,
  formData: FormData,
) {
  const actor = await requireStaff(bookingStaffRoles);
  const amount = moneySchema.safeParse(formValue(formData, "amount"));
  const type = z.nativeEnum(PaymentType).safeParse(formValue(formData, "type"));
  const method = z.string().trim().min(2).max(60).safeParse(
    formValue(formData, "method"),
  );
  const paymentDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .safeParse(formValue(formData, "paymentDate"));
  const transactionRef = z
    .string()
    .trim()
    .max(120)
    .safeParse(formValue(formData, "transactionRef"));
  const notes = z.string().trim().max(1000).safeParse(formValue(formData, "notes"));

  if (
    !amount.success ||
    !type.success ||
    !method.success ||
    !paymentDate.success ||
    !transactionRef.success ||
    !notes.success
  ) {
    throw new Error("Check the manual payment details and try again.");
  }

  const date = new Date(`${paymentDate.data}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date > new Date()) {
    throw new Error("Payment date must be a valid date that is not in the future.");
  }

  const booking = await prisma.$transaction(async (transaction) => {
    const current = await transaction.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        agreedAmount: true,
        currency: true,
        payments: {
          where: { verified: true },
          select: { amount: true },
        },
      },
    });
    if (!current) throw new Error("Booking request was not found.");
    if (!current.agreedAmount || !current.currency) {
      throw new Error("Set the agreed booking amount before recording payments.");
    }

    const recordedAmount = current.payments.reduce(
      (total, payment) => total.plus(payment.amount),
      new Prisma.Decimal(0),
    );
    const paymentAmount = new Prisma.Decimal(amount.data);
    if (recordedAmount.plus(paymentAmount).greaterThan(current.agreedAmount)) {
      throw new Error("This payment exceeds the outstanding agreed balance.");
    }

    const payment = await transaction.paymentRecord.create({
      data: {
        bookingId: current.id,
        amount: paymentAmount,
        currency: current.currency,
        paymentDate: date,
        method: method.data,
        transactionRef: transactionRef.data || null,
        type: type.data,
        verified: false,
        internalNotes: notes.data || null,
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "MANUAL_PAYMENT_RECORDED",
        entityType: "PaymentRecord",
        entityId: payment.id,
        details: {
          bookingReference: current.reference,
          amount: paymentAmount.toFixed(2),
          currency: current.currency,
          verified: false,
        },
      },
    });
    return current;
  });

  revalidatePath(detailPath(booking.reference));
  redirect(`${detailPath(booking.reference)}?updated=payment`);
}

export async function verifyManualPayment(paymentId: string) {
  const actor = await requireStaff([StaffRole.SUPER_ADMIN, StaffRole.ADMIN]);
  const bookingReference = await prisma.$transaction(async (transaction) => {
    const payment = await transaction.paymentRecord.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          select: {
            id: true,
            reference: true,
            agreedAmount: true,
            currency: true,
            payments: {
              where: { verified: true },
              select: { id: true, amount: true },
            },
          },
        },
      },
    });
    if (!payment) throw new Error("Payment record was not found.");
    if (payment.verified) throw new Error("This payment has already been verified.");
    if (!payment.booking.agreedAmount || !payment.booking.currency) {
      throw new Error("Set an agreed booking amount before verifying payments.");
    }
    if (payment.currency !== payment.booking.currency) {
      throw new Error("Payment currency does not match the agreed booking currency.");
    }

    const verifiedTotal = payment.booking.payments.reduce(
      (total, item) => total.plus(item.amount),
      new Prisma.Decimal(0),
    );
    if (
      verifiedTotal.plus(payment.amount).greaterThan(payment.booking.agreedAmount)
    ) {
      throw new Error("Verifying this payment would exceed the agreed amount.");
    }

    await transaction.paymentRecord.update({
      where: { id: payment.id },
      data: {
        verified: true,
        verifiedById: actor.id,
        verifiedAt: new Date(),
      },
    });
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "MANUAL_PAYMENT_VERIFIED",
        entityType: "PaymentRecord",
        entityId: payment.id,
        details: {
          bookingReference: payment.booking.reference,
          amount: payment.amount.toFixed(2),
          currency: payment.currency,
        },
      },
    });
    return payment.booking.reference;
  });

  revalidatePath(detailPath(bookingReference));
  redirect(`${detailPath(bookingReference)}?updated=verified`);
}

export async function logCustomerCommunication(
  bookingId: string,
  formData: FormData,
) {
  const actor = await requireStaff(bookingStaffRoles);
  const channel = z.enum(["EMAIL", "WHATSAPP", "PHONE", "OTHER"]).safeParse(
    formValue(formData, "channel"),
  );
  const summary = z.string().trim().min(3).max(2000).safeParse(
    formValue(formData, "summary"),
  );
  const direction = z.enum(["INBOUND", "OUTBOUND"]).safeParse(
    formValue(formData, "direction"),
  );
  if (!channel.success || !summary.success || !direction.success) {
    throw new Error("Enter a valid communication note.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, reference: true, customerId: true },
  });
  if (!booking) throw new Error("Booking request was not found.");

  await prisma.$transaction([
    prisma.communicationLog.create({
      data: {
        customerId: booking.customerId,
        bookingId: booking.id,
        channel: channel.data,
        direction: direction.data,
        summary: summary.data,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "CUSTOMER_COMMUNICATION_LOGGED",
        entityType: "Booking",
        entityId: booking.id,
        details: {
          reference: booking.reference,
          channel: channel.data,
          direction: direction.data,
        },
      },
    }),
  ]);

  revalidatePath(detailPath(booking.reference));
  redirect(`${detailPath(booking.reference)}?updated=communication`);
}
