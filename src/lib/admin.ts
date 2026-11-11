import { StaffRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireStaff(allowedRoles: StaffRole[]) {
  if (!process.env.AUTH_SECRET || !process.env.DATABASE_URL) {
    redirect("/admin/login?setup=required");
  }

  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  const staff = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      authVersion: true,
    },
  });
  if (!staff?.isActive) redirect("/admin/login?disabled=1");
  if (staff.authVersion !== session.user.authVersion) {
    redirect("/admin/login?session=expired");
  }
  if (!allowedRoles.includes(staff.role)) redirect("/admin/unauthorized");

  return staff;
}

export const bookingStaffRoles: StaffRole[] = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.SALES_MANAGER,
];
