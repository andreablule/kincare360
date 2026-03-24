import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import SessionProvider from "@/components/SessionProvider";

export const metadata = {
  title: "Dashboard | KinCare360",
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </SessionProvider>
  );
}
