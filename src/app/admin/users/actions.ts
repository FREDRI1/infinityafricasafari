"use server";

import { Prisma, StaffPermission, StaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStaff } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const staffUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  role: z.nativeEnum(StaffRole),
  permissions: z.array(z.nativeEnum(StaffPermission)).max(6),
});

const passwordSchema = z
  .string()
  .min(12, "Use a password with at least 12 characters.")
  .refine((password) => Buffer.byteLength(password, "utf8") <= 72, {
    message: "Password must not exceed 72 UTF-8 bytes.",
  });

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function assertStaffUserInput(formData: FormData) {
  const parsed = staffUserSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email").toLocaleLowerCase(),
    role: field(formData, "role"),
    permissions: [
      ...new Set(
        formData
          .getAll("permissions")
          .filter((value): value is string => typeof value === "string"),
      ),
    ],
  });
  if (!parsed.success) {
    throw new Error(
      `Staff details are invalid: ${parsed.error.issues[0]?.message ?? "check the form."}`,
    );
  }
  return parsed.data;
}

export async function createStaffUser(formData: FormData) {
  const actor = await requireStaff([StaffRole.SUPER_ADMIN]);
  const input = assertStaffUserInput(formData);
  const password = passwordSchema.safeParse(field(formData, "password"));
  if (!password.success) {
    throw new Error(password.error.issues[0]?.message ?? "Choose a stronger password.");
  }
  const passwordHash = await bcrypt.hash(password.data, 12);

  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        permissions:
          input.role === StaffRole.SUPER_ADMIN ? [] : input.permissions,
        passwordHash,
      },
      select: { id: true },
    });
    await transaction.auditLog.create({
      data: {
        actorId: actor.id,
        action: "STAFF_USER_CREATED",
        entityType: "User",
        entityId: user.id,
        details: {
          email: input.email,
          role: input.role,
          permissions:
            input.role === StaffRole.SUPER_ADMIN ? [] : input.permissions,
        },
      },
    });
  });

  revalidatePath("/admin/users");
  redirect("/admin/users?created=1");
}

export async function updateStaffUser(
  userId: string,
  formData: FormData,
) {
  const actor = await requireStaff([StaffRole.SUPER_ADMIN]);
  const input = assertStaffUserInput(formData);
  const activeValue = field(formData, "isActive");
  if (activeValue !== "true" && activeValue !== "false") {
    throw new Error("Choose whether this staff account is active.");
  }
  const isActive = activeValue === "true";
  const passwordValue = field(formData, "password");
  const password = passwordValue ? passwordSchema.safeParse(passwordValue) : null;
  if (password && !password.success) {
    throw new Error(password.error.issues[0]?.message ?? "Choose a stronger password.");
  }
  const passwordHash = password?.success
    ? await bcrypt.hash(password.data, 12)
    : undefined;

  if (userId === actor.id && (!isActive || input.role !== StaffRole.SUPER_ADMIN)) {
    throw new Error("You cannot deactivate or demote your own super administrator account.");
  }

  await prisma.$transaction(
    async (transaction) => {
      const current = await transaction.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
        },
      });
      if (!current) throw new Error("Staff account was not found.");

      if (
        current.role === StaffRole.SUPER_ADMIN &&
        current.isActive &&
        (!isActive || input.role !== StaffRole.SUPER_ADMIN)
      ) {
        const remainingAdmins = await transaction.user.count({
          where: {
            role: StaffRole.SUPER_ADMIN,
            isActive: true,
            id: { not: current.id },
          },
        });
        if (remainingAdmins === 0) {
          throw new Error("At least one active super administrator must remain.");
        }
      }

      const updated = await transaction.user.update({
        where: { id: current.id },
        data: {
          name: input.name,
          email: input.email,
          role: input.role,
          permissions:
            input.role === StaffRole.SUPER_ADMIN ? [] : input.permissions,
          isActive,
          ...(passwordHash ? { authVersion: { increment: 1 } } : {}),
          ...(passwordHash ? { passwordHash } : {}),
        },
        select: { id: true },
      });
      await transaction.auditLog.create({
        data: {
          actorId: actor.id,
          action: "STAFF_USER_UPDATED",
          entityType: "User",
          entityId: updated.id,
          details: {
            previousRole: current.role,
            role: input.role,
            previousPermissions: current.permissions,
            permissions:
              input.role === StaffRole.SUPER_ADMIN ? [] : input.permissions,
            wasActive: current.isActive,
            isActive,
            emailChanged: current.email !== input.email,
            passwordReset: Boolean(passwordHash),
          } satisfies Prisma.InputJsonObject,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users?saved=1");
}
