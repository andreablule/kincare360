import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PATCH: Update prospect status
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.email !== 'hello@kincare360.com' && user.email !== 'andreablule@gmail.com')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    const valid = ['NEW', 'CONTACTED', 'CONVERTED', 'LOST'];
    if (!valid.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.prospect.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, prospect: updated });
  } catch (err) {
    console.error('Prospect update error:', err);
    return NextResponse.json({ error: 'Failed to update prospect' }, { status: 500 });
  }
}

// GET: List all prospects (admin only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || (user.role !== 'ADMIN' && user.email !== 'hello@kincare360.com' && user.email !== 'andreablule@gmail.com')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prospects = await prisma.prospect.findMany({
    orderBy: { lastCallAt: 'desc' },
  });

  return NextResponse.json(prospects);
}
