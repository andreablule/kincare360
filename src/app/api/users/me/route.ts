import { prisma } from "@/lib/prisma";
import { getSessionUser, getSessionPatientId } from "@/lib/session";

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "CLIENT" || user.role === "ADMIN") {
    // CLIENT: cancel Stripe subscription, then delete all data in cascade order
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

    // Cancel Stripe subscription if exists
    if (dbUser?.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
      try {
        // Find and cancel active subscriptions
        const subsResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${dbUser.stripeCustomerId}&status=active`,
          {
            headers: {
              Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
            },
          }
        );
        const subsData = await subsResponse.json();
        for (const sub of subsData.data || []) {
          await fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
          });
        }
      } catch (err) {
        console.error("Stripe cancellation error:", err);
      }
    }

    // Delete all patient-related data
    const patientId = await getSessionPatientId(user);
    if (patientId) {
      // Find and delete all family member user accounts linked to this patient
      const familyMembers = await prisma.familyMember.findMany({
        where: { patientId },
        select: { userId: true },
      });

      for (const fm of familyMembers) {
        if (fm.userId) {
          // Unlink before delete to avoid foreign key issues
          await prisma.familyMember.updateMany({ where: { userId: fm.userId }, data: { userId: null } });
          await prisma.user.delete({ where: { id: fm.userId } });
        }
      }

      // Delete patient records (cascade will handle related records via Prisma)
      await prisma.callLog.deleteMany({ where: { patientId } });
      await prisma.serviceRequest.deleteMany({ where: { patientId } });
      await prisma.medication.deleteMany({ where: { patientId } });
      await prisma.condition.deleteMany({ where: { patientId } });
      await prisma.doctor.deleteMany({ where: { patientId } });
      await prisma.pharmacy.deleteMany({ where: { patientId } });
      await prisma.familyMember.deleteMany({ where: { patientId } });
      await prisma.patient.delete({ where: { id: patientId } });
    }

    // Finally delete the owner account
    await prisma.user.delete({ where: { id: user.id } });
    return Response.json({ ok: true });
  }

  if (user.role === "FAMILY" || user.role === "MANAGER") {
    // Non-owner: unlink from FamilyMember, delete user account
    await prisma.familyMember.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });
    await prisma.user.delete({ where: { id: user.id } });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Cannot delete this account type" }, { status: 400 });
}
