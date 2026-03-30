// Generates a printable HTML flyer for partner referral program
export function generateFlyer(partnerName: string, referralCode: string, referralLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 0.5in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0F2147; background: #fff; }
  .page { max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
  .header { text-align: center; margin-bottom: 24px; }
  .logo { height: 60px; margin-bottom: 8px; }
  .headline { font-size: 32px; font-weight: 800; color: #0F2147; line-height: 1.2; margin-bottom: 8px; }
  .subline { font-size: 16px; color: #555; margin-bottom: 20px; }
  .punch { font-size: 18px; font-style: italic; color: #0F2147; opacity: 0.8; margin-bottom: 24px; }
  .features { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
  .feature { flex: 1; min-width: 200px; background: #f0faf9; border-radius: 12px; padding: 16px; text-align: center; }
  .feature-icon { font-size: 32px; margin-bottom: 8px; }
  .feature-title { font-size: 14px; font-weight: 700; color: #0F2147; margin-bottom: 4px; }
  .feature-desc { font-size: 12px; color: #555; }
  .pricing { background: #0EA5A0; color: white; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
  .price { font-size: 42px; font-weight: 800; }
  .price-sub { font-size: 16px; opacity: 0.9; }
  .trial { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 6px 16px; font-size: 14px; font-weight: 600; margin-top: 8px; }
  .cta { background: #0F2147; color: white; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
  .cta-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .cta-phone { font-size: 28px; font-weight: 800; color: #0EA5A0; background: white; display: inline-block; padding: 8px 24px; border-radius: 12px; margin: 8px 0; }
  .cta-web { font-size: 18px; margin-top: 8px; }
  .cta-web a { color: #0EA5A0; text-decoration: none; font-weight: 700; }
  .referral { border: 3px dashed #0EA5A0; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px; }
  .referral-title { font-size: 14px; color: #555; margin-bottom: 4px; }
  .referral-code { font-size: 24px; font-weight: 800; color: #0EA5A0; font-family: monospace; letter-spacing: 2px; }
  .referral-save { font-size: 16px; font-weight: 700; color: #0F2147; margin-top: 8px; }
  .footer { text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
  .partner-line { font-size: 12px; color: #777; text-align: center; margin-bottom: 16px; }
  .tear-strip { display: flex; flex-wrap: wrap; gap: 0; margin-top: 16px; border-top: 2px dashed #ccc; padding-top: 12px; }
  .tear-tab { flex: 1; min-width: 100px; text-align: center; border-right: 1px dashed #ccc; padding: 8px 4px; }
  .tear-tab:last-child { border-right: none; }
  .tear-phone { font-size: 11px; font-weight: 700; color: #0EA5A0; }
  .tear-site { font-size: 9px; color: #777; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="https://kincare360.com/kincare360-logo.png" alt="KinCare360" class="logo" />
    <div class="headline">Daily Wellness Calls<br/>for Your Aging Parent</div>
    <div class="subline">AI-powered check-ins, medication reminders, and care coordination — so you can breathe.</div>
    <div class="punch">"The call you don't make shouldn't be the one you regret."</div>
  </div>

  <div class="features">
    <div class="feature">
      <div class="feature-icon">📞</div>
      <div class="feature-title">Daily Check-In Calls</div>
      <div class="feature-desc">Lily calls your loved one every day to check on their wellbeing</div>
    </div>
    <div class="feature">
      <div class="feature-icon">💊</div>
      <div class="feature-title">Medication Reminders</div>
      <div class="feature-desc">Never miss a dose — automatic calls at scheduled times</div>
    </div>
    <div class="feature">
      <div class="feature-icon">📅</div>
      <div class="feature-title">Appointment Scheduling</div>
      <div class="feature-desc">Lily calls doctors and books appointments for your parent</div>
    </div>
    <div class="feature">
      <div class="feature-icon">👨‍👩‍👧</div>
      <div class="feature-title">Family Dashboard</div>
      <div class="feature-desc">See daily summaries, mood, and concerns — all in one place</div>
    </div>
  </div>

  <div class="pricing">
    <div class="price">$99<span style="font-size:18px;font-weight:400">/month</span></div>
    <div class="price-sub">Everything included. No hidden fees. Cancel anytime.</div>
    <div class="trial">✅ 7-Day Free Trial — No Charge Until Day 8</div>
  </div>

  <div class="referral">
    <div class="referral-title">Use this code when signing up:</div>
    <div class="referral-code">${referralCode}</div>
    <div class="referral-save">💰 Save $50 on your first month!</div>
  </div>

  <div class="cta">
    <div class="cta-title">Get Started Today</div>
    <div class="cta-phone">(812) 515-5252</div>
    <div class="cta-web">Visit <a href="${referralLink}">${referralLink.replace('https://', '')}</a></div>
  </div>

  ${partnerName ? `<div class="partner-line">Referred by: ${partnerName}</div>` : ''}

  <div class="footer">
    © 2026 Son Healthcare Services LLC, operating as KinCare360. KinCare360 is a non-medical care coordination service, not a substitute for emergency care.
  </div>

  <!-- Tear-off tabs for bulletin boards -->
  <div class="tear-strip">
    ${Array(6).fill('').map(() => `<div class="tear-tab"><div class="tear-phone">(812) 515-5252</div><div class="tear-site">kincare360.com</div><div style="font-size:8px;color:#0EA5A0;margin-top:2px;">Code: ${referralCode}</div></div>`).join('')}
  </div>
</div>
</body>
</html>`;
}
