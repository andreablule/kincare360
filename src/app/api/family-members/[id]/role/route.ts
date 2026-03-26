import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId, canManageRoles } from "@/lib/session";

// PATCH /api/family-members/[id]/role — owner grants/revokes MANAGER role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRoles(user.role)) {
    return Response.json({ error: "Only the account owner can manage roles" }, { status: 403 });
  }

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const familyMember = await prisma.familyMember.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!familyMember || familyMember.patientId !== patientId) {
    return Response.json({ error: "Family member not found" }, { status: 404 });
  }

  const body = await req.json();
  const newRole = body.role as string;

  if (!["MANAGER", "FAMILY"].includes(newRole)) {
    return Response.json({ error: "Invalid role. Must be MANAGER or FAMILY" }, { status: 400 });
  }

  // Update the linked user's role if they have an account
  if (familyMember.userId) {
    await prisma.user.update({
      where: { id: familyMember.userId },
      data: { role: newRole },
    });
  }

  return Response.json({ ok: true, role: newRole });
}
