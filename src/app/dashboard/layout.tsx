import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllPatientsForUser } from "@/lib/patient";
import DashboardShell from "@/components/DashboardShell";
import { PatientProvider } from "@/components/PatientContext";

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

  // Fetch patient names for display
  const userId = fullUser?.id;
  const userRole = fullUser?.role || "CLIENT";
  const userPatientId = fullUser?.patientId ?? null;
  let displayName = fullUser?.name || fullUser?.email;

  if (userId) {
    const ownerUserId = (userRole === "FAMILY" || userRole === "MANAGER")
      ? (userPatientId ? (await prisma.patient.findUnique({ where: { id: userPatientId }, select: { userId: true } }))?.userId : null)
      : userId;
    if (ownerUserId) {
      const patients = await getAllPatientsForUser(ownerUserId);
      if (patients.length > 0) {
        displayName = patients.map(p => `${p.firstName} ${p.lastName}`).join(" & ");
      }
    }
  }

  return (
    <DashboardShell user={{ ...fullUser, displayName }}>
      <PatientProvider>{children}</PatientProvider>
    </DashboardShell>
  );
}
