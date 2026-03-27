import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId, canManageFamilyMembers, resolvePatientIdFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const requestedId = req.nextUrl.searchParams.get("patientId");
  const patientId = await resolvePatientIdFromRequest(user, requestedId);
  if (!patientId) return Response.json({ items: [] });

  const items = await prisma.familyMember.findMany({
    where: { patientId },
    include: {
      user: {
        select: { id: true, role: true, inviteToken: true, inviteExpiry: true },
      },
    },
  });

  // Compute invite status for each member
  const enriched = items.map((m) => {
    let inviteStatus: "none" | "pending" | "active" = "none";
    if (m.user) {
      if (m.user.inviteToken && m.user.inviteExpiry && new Date(m.user.inviteExpiry) > new Date()) {
        inviteStatus = "pending";
      } else if (!m.user.inviteToken) {
        inviteStatus = "active";
      } else {
        // Token expired but user exists — treat as pending (expired)
        inviteStatus = "pending";
      }
    }
    return {
      ...m,
      inviteStatus,
      linkedRole: m.user?.role ?? null,
    };
  });

  return Response.json({ items: enriched });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageFamilyMembers(user.role)) return Response.json({ error: "Insufficient permissions" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  if (!patientId) return Response.json({ error: "No patient profile" }, { status: 400 });

  const body = await req.json();
  const item = await prisma.familyMember.create({
    data: {
      patientId,
      name: body.name,
      relationship: body.relationship,
      phone: body.phone,
      email: body.email,
      notifyUpdates: body.notifyUpdates ?? true,
    },
  });
  return Response.json({ item });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const patientId = await getSessionPatientId(user);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.familyMember.findUnique({ where: { id } });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  // FAMILY members can only update their own record
  if (user.role === "FAMILY") {
    const isOwnRecord = existing.userId === user.id;
    if (!isOwnRecord) return Response.json({ error: "You can only update your own profile" }, { status: 403 });
  }

  const body = await req.json();
  const item = await prisma.familyMember.update({
    where: { id },
    data: {
      name: body.name,
      relationship: body.relationship,
      phone: body.phone,
      email: body.email,
      notifyUpdates: body.notifyUpdates ?? true,
    },
  });
  return Response.json({ item });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageFamilyMembers(user.role)) return Response.json({ error: "Insufficient permissions" }, { status: 403 });

  const patientId = await getSessionPatientId(user);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const existing = await prisma.familyMember.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!existing || existing.patientId !== patientId) return Response.json({ error: "Not found" }, { status: 404 });

  // If linked to a user account, delete that too
  if (existing.userId) {
    await prisma.familyMember.update({ where: { id }, data: { userId: null } });
    await prisma.user.delete({ where: { id: existing.userId } });
  }

  await prisma.familyMember.delete({ where: { id } });
  return Response.json({ ok: true });
}
