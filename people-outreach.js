const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hello@kincare360.com', pass: 'rogv owro cfhd sasp' }
});

// These are caregiver community sites, blogs, directories, and newsletters
// that accept tips/submissions or have public contact emails
const targets = [
  // Caregiver blogs & communities
  { name: 'AgingCare Community', email: 'info@agingcare.com', note: 'Largest caregiver forum' },
  { name: 'DailyCaring', email: 'info@dailycaring.com', note: 'Caregiver tips blog' },
  { name: 'Caregiver Action Network', email: 'info@caregiveraction.org', note: 'National caregiver org' },
  { name: 'Family Caregiver Alliance', email: 'info@caregiver.org', note: 'Major caregiver resource' },
  { name: 'AARP Caregiving', email: 'member@aarp.org', note: '38M members, many caregivers' },
  { name: 'Caring Bridge', email: 'customercare@caringbridge.org', note: 'Health journey platform' },
  { name: 'Lotsa Helping Hands', email: 'support@lotsahelpinghands.com', note: 'Care coordination community' },
  // Elder care directories that list services
  { name: 'Caring.com', email: 'info@caring.com', note: 'Senior care directory' },
  { name: 'SeniorAdvisor', email: 'info@senioradvisor.com', note: 'Senior living reviews' },
  { name: 'A Place for Mom', email: 'info@aplaceformom.com', note: 'Senior care referral' },
  // Caregiver podcasts & media
  { name: 'The Caregiver Space', email: 'info@thecaregiverspace.org', note: 'Caregiver community' },
  { name: 'Daughterhood', email: 'hello@daughterhood.org', note: 'Women caregivers community' },
  { name: 'CaregivingAdvice.com', email: 'info@caregivingadvice.com', note: 'Caregiver education' },
  // Health/wellness newsletters & blogs
  { name: 'Next Avenue (PBS)', email: 'letters@nextavenue.org', note: 'PBS aging/caregiving media' },
  { name: 'Today\'s Caregiver', email: 'info@caregiver.com', note: 'Caregiver magazine' },
];

const subject = 'Checking on aging parents daily — a service your community should know about';
const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.7; color: #333;">
<p>Hi there,</p>

<p>I'm reaching out because your community helps families who are caring for aging parents — and I think KinCare360 could genuinely help them.</p>

<p><strong>The problem we solve:</strong> Millions of adult children worry every day about their aging parent living alone. Did they take their medication? Did they eat? What if they fell?</p>

<p><strong>Our solution:</strong> KinCare360's AI care assistant <strong>Lily</strong> calls their loved one every single morning to check in. She asks how they're feeling, reminds medications, and if anything seems wrong, she alerts the entire family instantly.</p>

<p>It's like having a caring friend check on your parent every day — without fail.</p>

<ul>
  <li>Plans start at <strong>$50/month</strong></li>
  <li><strong>7-day free trial</strong> (no credit card required)</li>
  <li>No apps to install, no devices — just a daily phone call</li>
  <li>Family dashboard so everyone stays in the loop</li>
</ul>

<p>We'd love for your audience to know about this. Whether it's a mention in your newsletter, a listing in your resource directory, or just sharing with families who might benefit — we're grateful for any help getting the word out.</p>

<p>You can try it yourself right now — just call Lily at <strong>(812) 515-5252</strong> and she'll walk you through everything.</p>

<p><strong>Website:</strong> <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></p>

<p>Thank you for the work you do for caregivers. It matters more than you know.</p>

<p style="color: #666;">The KinCare360 Team<br>
<a href="mailto:hello@kincare360.com" style="color: #0d9488;">hello@kincare360.com</a> | (812) 515-5252</p>
</div>
`;

async function send() {
  let sent = 0;
  for (const target of targets) {
    try {
      await transporter.sendMail({
        from: 'KinCare360 <hello@kincare360.com>',
        to: target.email,
        subject,
        html
      });
      console.log('OK: ' + target.name + ' (' + target.email + ') — ' + target.note);
      sent++;
      await new Promise(r => setTimeout(r, 5000));
    } catch(e) {
      console.error('FAIL: ' + target.name + ' - ' + e.message);
    }
  }
  console.log('\nTotal sent: ' + sent + '/' + targets.length);
}
send();
