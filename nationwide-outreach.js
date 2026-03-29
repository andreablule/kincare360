const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hello@kincare360.com', pass: 'rogv owro cfhd sasp' }
});

// Nationwide home health agencies and senior care organizations
const targets = [
  // Major national agencies
  { name: 'Amedisys Home Health', email: 'info@amedisys.com' },
  { name: 'LHC Group', email: 'info@lhcgroup.com' },
  { name: 'Kindred at Home', email: 'info@kindredathome.com' },
  { name: 'Enhabit Home Health', email: 'info@enhabit.com' },
  // New York
  { name: 'Visiting Nurse Service of NY', email: 'info@vnsny.org' },
  { name: 'Partners in Care NY', email: 'info@partnersincare.org' },
  // Florida
  { name: 'BrightStar Care Miami', email: 'info@brightstarcare.com' },
  { name: 'Interim Healthcare Florida', email: 'info@interimhealthcare.com' },
  // Texas
  { name: 'Elara Caring Texas', email: 'info@elara.com' },
  { name: 'AccordantHealth TX', email: 'info@accordant.com' },
  // California
  { name: 'Kaiser Home Health CA', email: 'info@kaiserpermanente.org' },
  // Senior living / aging organizations
  { name: 'National Council on Aging', email: 'info@ncoa.org' },
  { name: 'Aging Life Care Association', email: 'info@aginglifecare.org' },
  { name: 'National Association for Home Care', email: 'info@nahc.org' },
  { name: 'American Society on Aging', email: 'info@asaging.org' },
];

const subject = 'Daily AI wellness calls for your clients - fill the gap between visits';
const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hi,</p>
<p>Between your team's visits, who's checking on your clients every day?</p>
<p><strong>KinCare360</strong> is an AI care coordination platform that fills that gap:</p>
<ul>
  <li><strong>Daily wellness check-in calls</strong> &mdash; our AI assistant Lily calls every morning to ask how they're feeling</li>
  <li><strong>Medication reminders</strong> &mdash; as many times per day as needed</li>
  <li><strong>Instant emergency alerts</strong> &mdash; family gets notified immediately if something's wrong</li>
  <li><strong>Family dashboard</strong> &mdash; everyone stays informed, no more phone tag</li>
</ul>
<p>Your clients sign up directly at <a href="https://kincare360.com" style="color: #0d9488; font-weight: bold;">kincare360.com</a>. No setup required on your end. No extra work for your staff.</p>
<p>Plans start at <strong>$50/month</strong> with a <strong>free 7-day trial</strong>. Available nationwide.</p>
<p><strong>See how it works: <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></strong></p>
<p>Or call Lily directly to hear it in action: <strong>(812) 515-5252</strong></p>
<br>
<p style="color: #666;">The KinCare360 Team<br>
<a href="mailto:hello@kincare360.com" style="color: #0d9488;">hello@kincare360.com</a> | (812) 515-5252<br>
<a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></p>
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
      console.log('OK: ' + target.name + ' (' + target.email + ')');
      sent++;
      // Rate limit: 5 seconds between emails to avoid spam flags
      await new Promise(r => setTimeout(r, 5000));
    } catch(e) {
      console.error('FAIL: ' + target.name + ' - ' + e.message);
    }
  }
  console.log('\nTotal sent: ' + sent + '/' + targets.length);
}
send();
