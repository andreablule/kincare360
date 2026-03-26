import { prisma } from "./prisma";

const patientInclude = {
  doctors: true,
  pharmacies: true,
  medications: true,
  conditions: true,
  familyMembers: {
    include: { user: { select: { id: true, role: true, inviteToken: true, inviteExpiry: true } } },
  },
  callLogs: {
    orderBy: { callDate: "desc" as const },
    take: 50,
  },
  user: {
    select: { id: true, plan: true, subscriptionStatus: true, role: true },
  },
};

/**
 * Returns the patient for a given user, respecting role:
 * - CLIENT: finds patient where patient.userId = userId
 * - MANAGER / FAMILY: finds patient where patient.id = patientId (direct link)
 */
export async function getPatientForUser(
  userId: string,
  role: string,
  patientId?: string | null
) {
  if ((role === "FAMILY" || role === "MANAGER") && patientId) {
    return prisma.patient.findUnique({
      where: { id: patientId },
      include: patientInclude,
    });
  }
  return prisma.patient.findFirst({
    where: { userId },
    include: patientInclude,
  });
}

/**
 * Returns only the patient id for a given user (lightweight version).
 */
export async function getPatientIdForUser(
  userId: string,
  role: string,
  patientId?: string | null
): Promise<string | null> {
  if ((role === "FAMILY" || role === "MANAGER") && patientId) return patientId;
  const patient = await prisma.patient.findFirst({
    where: { userId },
    select: { id: true },
  });
  return patient?.id ?? null;
}

/** Check if this user can edit (CLIENT or MANAGER) */
export function canEdit(role: string) {
  return role === "CLIENT" || role === "MANAGER" || role === "ADMIN";
}

/** Check if this user can manage billing (CLIENT only) */
export function canManageBilling(role: string) {
  return role === "CLIENT" || role === "ADMIN";
}

/** Check if this user can invite/remove family members */
export function canInvite(role: string) {
  return role === "CLIENT" || role === "ADMIN";
}

/** Check if this user can promote/demote roles */
export function canManageRoles(role: string) {
  return role === "CLIENT" || role === "ADMIN";
}
