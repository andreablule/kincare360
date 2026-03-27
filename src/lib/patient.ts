import { prisma } from "./prisma";
import { isFamilyPlan } from "./format-plan";

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

/**
 * Returns ALL patients for a user (used for family plans with 2 patients).
 */
export async function getAllPatientsForUser(userId: string) {
  return prisma.patient.findMany({
    where: { userId },
    orderBy: { id: "asc" },
  });
}

/**
 * Validates that a specific patient belongs to the given user.
 * Returns the patientId if valid, null otherwise.
 */
export async function resolvePatientId(
  userId: string,
  role: string,
  sessionPatientId: string | null | undefined,
  requestedPatientId: string | null | undefined
): Promise<string | null> {
  // If a specific patient was requested, validate ownership
  if (requestedPatientId) {
    if (role === "CLIENT") {
      const patient = await prisma.patient.findFirst({
        where: { id: requestedPatientId, userId },
        select: { id: true },
      });
      return patient?.id ?? null;
    }
    // FAMILY/MANAGER can only access their linked patient
    if ((role === "FAMILY" || role === "MANAGER") && sessionPatientId === requestedPatientId) {
      return requestedPatientId;
    }
    return null;
  }
  // Default: return first patient
  return getPatientIdForUser(userId, role, sessionPatientId);
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
