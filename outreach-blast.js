const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hello@kincare360.com', pass: 'rogv owro cfhd sasp' }
});

const agencies = [
  { name: 'Bayada Home Health Care', email: 'info@bayada.com' },
  { name: 'Comfort Keepers Philadelphia', email: 'philadelphiapa046@comfortkeepers.com' },
  { name: 'Visiting Angels Philadelphia', email: 'office@visitingangels.com' },
  { name: 'BrightSpring Health', email: 'info@brightspringhealth.com' },
  { name: 'Griswold Home Care Philadelphia', email: 'info@griswoldhomecare.com' },
];

const subject = 'Add daily AI monitoring for your clients - no extra work for your team';
const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6;">
<p>Hi,</p>
<p>KinCare360 is an AI care coordination platform built for home health agencies like yours.</p>
<p><strong>Here's what it does for your clients:</strong></p>
<ul>
  <li>Daily wellness check-in calls &mdash; fills the gap between your visits</li>
  <li>Medication reminders to reduce missed doses</li>
  <li>Instant alerts to family when something's wrong</li>
  <li>Family dashboard so everyone stays informed</li>
</ul>
<p>No tech setup required on your end. Your clients sign up directly at <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a> &mdash; and you get the peace of mind that someone's checking in every day.</p>
<p><strong>See how it works: <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></strong></p>
<br>
<p>The KinCare360 Team<br>
<a href="mailto:hello@kincare360.com">hello@kincare360.com</a> | (812) 515-5252</p>
</div>
`;

async function send() {
  let sent = 0;
  for (const agency of agencies) {
    try {
      await transporter.sendMail({
        from: 'KinCare360 <hello@kincare360.com>',
        to: agency.email,
        subject,
        html
      });
      console.log('OK: ' + agency.name + ' (' + agency.email + ')');
      sent++;
      // Rate limit: wait 3 seconds between emails
      await new Promise(r => setTimeout(r, 3000));
    } catch(e) {
      console.error('FAIL: ' + agency.name + ' - ' + e.message);
    }
  }
  console.log('\nSent ' + sent + '/' + agencies.length + ' emails');
}
send();
