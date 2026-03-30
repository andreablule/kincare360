import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;
const alertPhone = process.env.ALERT_PHONE_NUMBER || '+12674996927';
const SK = process.env.STRIPE_SECRET_KEY!;

async function sendSMS(to: string, body: string) {
  const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: twilioPhone, Body: body });
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
  } catch (e) {
    console.error('SMS error:', e);
  }
}

async function stripeAPI(path: string, body: Record<string, string>) {
  const auth = Buffer.from(`${SK}:`).toString('base64');
  const res = await fetch(`https://api.stripe.com${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

async function stripeGet(path: string) {
  const auth = Buffer.from(`${SK}:`).toString('base64');
  const res = await fetch(`https://api.stripe.com${path}`, {
    headers: { 'Authorization': `Basic ${auth}` },
  });
  return res.json();
}

async function sendWelcomeEmail(to: string, customerName: string, trialEnd: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'hello@kincare360.com',
        pass: process.env.GOOGLE_APP_PASSWORD || 'rogvowrocfhdsasp',
      },
    });

    const firstName = customerName.split(' ')[0] || 'there';

    await transporter.sendMail({
      from: '"Lily - KinCare360" <hello@kincare360.com>',
      to: to,
      subject: `Welcome to KinCare360, ${firstName}! Your 7-day free trial has started 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <img src="https://kincare360.com/kincare360-logo.png" alt="KinCare360" style="height: 60px; margin-bottom: 20px;" />

          <h1 style="color: #0F2147; font-size: 24px;">Welcome to KinCare360, ${firstName}!</h1>

          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Your 7-day free trial is now active. Here's what happens next:
          </p>

          <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #0F2147;"><strong>📞 Lily will start calling</strong> your loved one at their preferred time for daily wellness check-ins.</p>
          </div>

          <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #0F2147;"><strong>💊 Medication reminders</strong> will be sent at the times you selected during setup.</p>
          </div>

          <div style="background: #f0faf9; border-left: 4px solid #0EA5A0; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="margin: 0; color: #0F2147;"><strong>👨‍👩‍👧 Family dashboard</strong> — log in anytime at <a href="https://kincare360.com/login" style="color: #0EA5A0;">kincare360.com/login</a> to see daily summaries and care updates.</p>
          </div>

          <div style="background: #fff3cd; padding: 16px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; color: #856404;"><strong>📅 Your free trial ends:</strong> ${trialEnd}</p>
            <p style="margin: 8px 0 0 0; color: #856404; font-size: 14px;">No charge until then. Cancel anytime before this date and you won't be billed.</p>
          </div>

          <h2 style="color: #0F2147; font-size: 18px; margin-top: 30px;">Need help?</h2>
          <p style="color: #555; font-size: 16px;">
            Call Lily anytime: <a href="tel:+18125155252" style="color: #0EA5A0; font-weight: bold;">(812) 515-5252</a><br/>
            Email us: <a href="mailto:hello@kincare360.com" style="color: #0EA5A0;">hello@kincare360.com</a><br/>
            Visit: <a href="https://kincare360.com" style="color: #0EA5A0;">kincare360.com</a>
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="color: #999; font-size: 12px;">
            © 2026 Son Healthcare Services LLC, operating as KinCare360. All rights reserved.<br/>
            <a href="https://kincare360.com/terms" style="color: #999;">Terms of Service</a> ·
            <a href="https://kincare360.com/privacy" style="color: #999;">Privacy Policy</a><br/>
            Reply STOP to unsubscribe from SMS notifications.
          </p>
        </div>
      `,
    });
    console.log('Welcome email sent to:', to);
  } catch (e) {
    console.error('Email send error:', e);
  }
}

// Map Stripe price IDs to plan names
function planFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    'price_1TGVNLJlUr03cRD7PhMXGx9x': 'INDIVIDUAL',
    'price_1TGVNTJlUr03cRD7F9F5mgHh': 'FAMILY',
    'price_1TFgeLJlUr03cRD7PP0gW8gW': 'ESSENTIAL',
    'price_1TFgeMJlUr03cRD7fTOu4j0y': 'PLUS',
    'price_1TFgeOJlUr03cRD7Mli4BYhX': 'CONCIERGE',
    'price_1TFgePJlUr03cRD7o3hb9ZGN': 'ESSENTIAL_FAMILY',
    'price_1TFgeRJlUr03cRD7OIIRu8kg': 'PLUS_FAMILY',
    'price_1TFgeSJlUr03cRD7BAJ0XDzT': 'CONCIERGE_FAMILY',
  };
  return map[priceId] || 'ESSENTIAL';
}

async function processReferralReward(refCode: string, newCustomerId: string) {
  try {
    const referral = await prisma.referral.findUnique({ where: { code: refCode } });
    if (!referral) return;

    // Check if already processed for this customer
    const existing = await prisma.referralConversion.findFirst({
      where: { referralId: referral.id, newCustomerId },
    });
    if (existing) return;

    // For subscriber referrers (have userId): add $50 credit to their Stripe customer balance
    if (referral.userId) {
      const referrerUser = await prisma.user.findUnique({ where: { id: referral.userId } });
      if (referrerUser?.stripeCustomerId) {
        // Add -5000 (negative = credit) to customer balance
        await stripeAPI(`/v1/customers/${referrerUser.stripeCustomerId}/balance_transactions`, {
          amount: '-5000',
          currency: 'usd',
          description: 'Referral reward - $50 credit',
        });
      }
    }

    // For non-subscriber referrers with stripeAccountId: create Stripe Transfer
    if (!referral.userId && referral.stripeAccountId) {
      await stripeAPI('/v1/transfers', {
        amount: '5000',
        currency: 'usd',
        destination: referral.stripeAccountId,
        description: `Referral payout for code ${referral.code}`,
      });
    }

    // Create ReferralConversion record
    await prisma.referralConversion.create({
      data: {
        referralId: referral.id,
        newCustomerId,
        status: 'paid',
        amount: 50,
        paidAt: new Date(),
      },
    });

    // Update Referral earnings and count
    await prisma.referral.update({
      where: { code: refCode },
      data: {
        earnings: { increment: 50 },
        referralCount: { increment: 1 },
      },
    });

    // Send SMS to referrer
    if (referral.referrerPhone) {
      const digits = referral.referrerPhone.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
        await sendSMS(
          `+1${digits}`,
          `Your referral just subscribed! You earned $50. Total earnings: $${referral.earnings + 50}. Thank you for spreading the word about KinCare360!`
        );
      }
    }
  } catch (err) {
    console.error('Referral reward error:', err);
  }
}

// Real Stripe webhook handler (called by Stripe with Stripe-Signature header)
async function handleStripeEvent(req: NextRequest): Promise<NextResponse> {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Cannot read body' }, { status: 400 });
  }

  // Verify webhook signature if secret is configured
  if (webhookSecret && sig) {
    const crypto = await import('crypto');
    const parts = sig.split(',').reduce((acc: Record<string, string>, part) => {
      const [key, val] = part.split('=');
      acc[key] = val;
      return acc;
    }, {});

    const timestamp = parts['t'];
    const expectedSig = parts['v1'];

    if (!timestamp || !expectedSig) {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 400 });
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const computedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    if (computedSig !== expectedSig) {
      console.error('Stripe webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const refCode = session.metadata?.ref;
        const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionStatus = 'trialing';

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              plan: plan || 'ESSENTIAL',
              subscriptionStatus,
              stripeCustomerId: stripeCustomerId || undefined,
            },
          });

          // Save referral code to patient record if present
          if (refCode) {
            const patient = await prisma.patient.findFirst({ where: { userId } });
            if (patient) {
              const referral = await prisma.referral.findUnique({ where: { code: refCode } });
              if (referral) {
                await prisma.patient.update({
                  where: { id: patient.id },
                  data: { referralCode: refCode },
                });
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status;
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan = sub.metadata?.plan || (priceId ? planFromPriceId(priceId) : undefined);

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: {
              subscriptionStatus: status,
              ...(plan ? { plan } : {}),
            },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        if (customerId) {
          // Check for referral reward on first real payment (after trial)
          // billing_reason === 'subscription_cycle' means first real charge after trial
          if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create') {
            // Find the user with this customer ID
            const user = await prisma.user.findFirst({
              where: { stripeCustomerId: customerId },
            });
            if (user) {
              // Check if this customer used a referral code
              const patient = await prisma.patient.findFirst({
                where: { userId: user.id, referralCode: { not: null } },
              });
              if (patient?.referralCode) {
                await processReferralReward(patient.referralCode, customerId);
              }
            }
          }

          // Handle pending plan downgrades
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId, pendingPlan: { not: null } },
          });
          if (user?.pendingPlan) {
            const PRICE_MAP: Record<string, string> = {
              ESSENTIAL: 'price_1TFgeLJlUr03cRD7PP0gW8gW',
              PLUS: 'price_1TFgeMJlUr03cRD7fTOu4j0y',
              CONCIERGE: 'price_1TFgeOJlUr03cRD7Mli4BYhX',
              ESSENTIAL_FAMILY: 'price_1TFgePJlUr03cRD7o3hb9ZGN',
              PLUS_FAMILY: 'price_1TFgeRJlUr03cRD7OIIRu8kg',
              CONCIERGE_FAMILY: 'price_1TFgeSJlUr03cRD7BAJ0XDzT',
            };
            const newPriceId = PRICE_MAP[user.pendingPlan];
            if (newPriceId) {
              const auth = Buffer.from(`${SK}:`).toString('base64');
              const subsRes = await fetch(
                `https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`,
                { headers: { Authorization: `Basic ${auth}` } }
              );
              const subs = await subsRes.json();
              const activeSub = subs?.data?.[0];
              if (activeSub) {
                const itemId = activeSub.items?.data?.[0]?.id;
                if (itemId) {
                  await fetch(`https://api.stripe.com/v1/subscriptions/${activeSub.id}`, {
                    method: 'POST',
                    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                      [`items[0][id]`]: itemId,
                      [`items[0][price]`]: newPriceId,
                      'proration_behavior': 'none',
                      [`metadata[plan]`]: user.pendingPlan,
                    }).toString(),
                  });
                }
              }
            }
            await prisma.user.update({
              where: { id: user.id },
              data: {
                plan: user.pendingPlan,
                pendingPlan: null,
                pendingPlanDate: null,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const customerId = sub.customer;

        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'canceled' },
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        if (customerId) {
          await prisma.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'past_due' },
          });
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Stripe event processing error:', err);
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

export async function POST(req: NextRequest) {
  // If this has a Stripe-Signature header, it's a real Stripe webhook
  if (req.headers.get('stripe-signature')) {
    return handleStripeEvent(req);
  }

  // Otherwise, it's the manual success-page callback
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID' }, { status: 400 });
    }

    const auth = Buffer.from(`${SK}:`).toString('base64');

    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}?expand[]=customer&expand[]=subscription`, {
      headers: { 'Authorization': `Basic ${auth}` },
    });
    const session = await sessionRes.json();

    if (!session || session.error) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    const customerEmail = session.customer_details?.email || session.customer?.email || '';
    const customerName = session.customer_details?.name || session.customer?.name || 'there';
    const customerPhone = session.customer_details?.phone || '';
    const planAmount = session.amount_total ? `$${session.amount_total / 100}` : '';
    const trialEnd = session.subscription?.trial_end
      ? new Date(session.subscription.trial_end * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : '7 days from now';

    // Update user plan + subscription status in DB using metadata from checkout
    const metadataUserId = session.metadata?.userId;
    const metadataPlan = session.metadata?.plan;
    const refCode = session.metadata?.ref;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
    const subscriptionStatus = session.subscription?.status || 'trialing';

    if (metadataUserId) {
      await prisma.user.update({
        where: { id: metadataUserId },
        data: {
          plan: metadataPlan || 'ESSENTIAL',
          subscriptionStatus,
          stripeCustomerId: stripeCustomerId || undefined,
        },
      });

      // Save referral code to patient record
      if (refCode) {
        const patient = await prisma.patient.findFirst({ where: { userId: metadataUserId } });
        if (patient) {
          const referral = await prisma.referral.findUnique({ where: { code: refCode } });
          if (referral) {
            await prisma.patient.update({
              where: { id: patient.id },
              data: { referralCode: refCode },
            });
          }
        }
      }
    }

    // 1. SMS alert to Andrea
    await sendSMS(
      `+1${alertPhone.replace(/\D/g, '').slice(-10)}`,
      `🎉 NEW KINCARE360 SIGNUP!\n\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone || 'Not provided'}\nPlan: ${planAmount}/mo\nTrial ends: ${trialEnd}\n\nLily will begin daily check-ins automatically.`
    );

    // 2. Welcome email to client
    if (customerEmail) {
      await sendWelcomeEmail(customerEmail, customerName, trialEnd);
    }

    // 3. SMS to client (if phone available)
    if (customerPhone) {
      const digits = customerPhone.replace(/\D/g, '').slice(-10);
      if (digits.length === 10) {
        await sendSMS(
          `+1${digits}`,
          `Welcome to KinCare360, ${customerName.split(' ')[0]}! 🎉\n\nYour 7-day free trial has started. Lily will begin daily check-ins at your preferred time.\n\nTrial ends: ${trialEnd}\nDashboard: kincare360.com/login\nCall Lily: (812) 515-5252\n\nReply STOP to opt out.`
        );
      }
    }

    return NextResponse.json({
      success: true,
      customer: { name: customerName, email: customerEmail },
      trialEnd
    });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
