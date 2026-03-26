import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";

export const metadata = {
  title: "Dashboard | KinCare360",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Pass full user including role and patientId to shell
  const fullUser = session.user as any;

  return (
    <DashboardShell user={fullUser}>{children}</DashboardShell>
  );
}
