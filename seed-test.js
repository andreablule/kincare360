const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'andrea@kincare360.com' },
    update: {},
    create: {
      email: 'andrea@kincare360.com',
      password: 'test',
      name: 'Andrea Lule',
      role: 'CLIENT',
      plan: 'PREMIUM',
      subscriptionStatus: 'active',
    }
  });

  const patient = await prisma.patient.upsert({
    where: { id: 'test-andrea' },
    update: { phone: '2674996927' },
    create: {
      id: 'test-andrea',
      userId: user.id,
      firstName: 'Andrea',
      lastName: 'Lule',
      phone: '2674996927',
      city: 'Philadelphia',
      state: 'PA',
      zip: '19103',
      preferredCallTime: '09:00',
      preferredLanguage: 'English',
    }
  });

  console.log('User:', user.id);
  console.log('Patient:', patient.id, patient.firstName, patient.phone);
}

main().catch(console.error).finally(() => prisma.$disconnect());
