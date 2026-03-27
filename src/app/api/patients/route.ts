import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });

  const patients = await prisma.patient.findMany({
    where: { userId: user.id },
    orderBy: { id: "asc" },
  });

  return Response.json({ patients, plan: dbUser?.plan || null });
}
