import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getPatientIdForUser } from "./patient";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  patientId: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as any;
  return {
    id: u.id,
    email: u.email || "",
    name: u.name || "",
    role: u.role || "CLIENT",
    patientId: u.patientId ?? null,
  };
}

export async function getSessionPatientId(user: SessionUser): Promise<string | null> {
  return getPatientIdForUser(user.id, user.role, user.patientId);
}

export function canEdit(role: string) {
  return role === "CLIENT" || role === "MANAGER" || role === "ADMIN";
}

export function canManageFamilyMembers(role: string) {
  return role === "CLIENT" || role === "ADMIN";
}

export function canManageRoles(role: string) {
  return role === "CLIENT" || role === "ADMIN";
}
