const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const today = new Date('2026-03-26T00:00:00Z');

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: today } },
    select: { email: true, createdAt: true, name: true }
  });

  const calls = await prisma.callLog.findMany({
    where: { createdAt: { gte: today } },
    select: { createdAt: true, callDate: true, summary: true, mood: true, urgent: true, callType: true }
  });

  const requests = await prisma.serviceRequest.findMany({
    where: { createdAt: { gte: today } },
    select: { createdAt: true, type: true, status: true }
  });

  const allUsers = await prisma.user.count();
  const allPatients = await prisma.patient.count();

  console.log('=== TODAY\'s ACTIVITY (March 26) ===');
  console.log('New signups:', users.length, JSON.stringify(users, null, 2));
  console.log('Calls today:', calls.length, JSON.stringify(calls, null, 2));
  console.log('Service requests today:', requests.length, JSON.stringify(requests, null, 2));
  console.log('=== TOTALS ===');
  console.log('Total users:', allUsers);
  console.log('Total patients:', allPatients);
}

main().catch(console.error).finally(() => prisma.$disconnect());
