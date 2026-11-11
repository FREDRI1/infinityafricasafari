import { StaffRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireStaff(allowedRoles: StaffRole[]) {
  if (!process.env.AUTH_SECRET || !process.env.DATABASE_URL) {
    redirect("/admin/login?setup=required");
  }

  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (!allowedRoles.includes(session.user.role)) redirect("/admin/unauthorized");

  return session.user;
}

export const bookingStaffRoles: StaffRole[] = [
  StaffRole.SUPER_ADMIN,
  StaffRole.ADMIN,
  StaffRole.SALES_MANAGER,
];
