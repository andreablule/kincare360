import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, stripeCustomerId, plan } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        stripeCustomerId: stripeCustomerId || null,
        plan: plan || null,
        subscriptionStatus: stripeCustomerId ? 'active' : null,
      },
    });

    // Create a default patient record
    await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: name ? name.split(' ')[0] : email.split('@')[0],
        lastName: name ? name.split(' ').slice(1).join(' ') : '',
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
