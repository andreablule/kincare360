import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, stripeCustomerId, plan, referralCode, mobilePhone, smsConsent } = await req.json();

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
    const phoneDigits = String(mobilePhone || "").replace(/\D/g, "").slice(-10);
    if (smsConsent === true && phoneDigits.length !== 10) {
      return NextResponse.json({ error: "A valid U.S. mobile number is required to opt in to SMS/text updates." }, { status: 400 });
    }

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

    // Validate referral code if provided
    let validReferralCode: string | null = null;
    if (referralCode) {
      const referral = await prisma.referral.findUnique({ where: { code: referralCode } });
      if (referral) {
        validReferralCode = referral.code;
        // Track referral usage (earnings paid on first invoice via webhook)
        await prisma.referral.update({
          where: { code: referral.code },
          data: { referralCount: { increment: 1 } },
        });
      }
    }

    // Create a default patient record
    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: name ? name.split(' ')[0] : email.split('@')[0],
        lastName: name ? name.split(' ').slice(1).join(' ') : '',
        phone: phoneDigits ? phoneDigits : null,
        referralCode: validReferralCode,
      },
    });

    // If the account owner separately opts in to SMS during signup, record the consent
    // with the existing FamilyMember SMS-consent fields so outbound text paths can gate on consent.
    if (smsConsent === true && phoneDigits.length === 10) {
      await prisma.familyMember.create({
        data: {
          patientId: patient.id,
          name: name || email,
          relationship: 'Account owner',
          phone: phoneDigits,
          email,
          alertMode: 'both',
          alertsEnabled: true,
          notifyUpdates: true,
          smsConsentStatus: 'opted_in',
          smsConsentSource: 'signup_web_form',
          smsConsentedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, userId: user.id });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
