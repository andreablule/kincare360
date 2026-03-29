const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hello@kincare360.com', pass: 'rogv owro cfhd sasp' }
});

// Category-specific subject lines and intros
const templates = {
  homecare: {
    subject: 'Partnership Opportunity: Daily AI wellness calls for your clients',
    intro: 'Between your team\'s visits, who\'s checking on your clients every day? KinCare360 fills that gap.'
  },
  snf: {
    subject: 'Reduce readmissions with daily AI check-in calls after discharge',
    intro: 'Post-discharge readmissions are costly and often preventable. KinCare360 provides daily AI wellness calls that catch issues before they become emergencies.'
  },
  assisted: {
    subject: 'Daily AI wellness calls — a value-add for your residents\' families',
    intro: 'Families of assisted living residents want extra peace of mind. KinCare360 provides daily AI check-in calls that keep families informed and residents connected.'
  },
  rehab: {
    subject: 'Continuity monitoring after rehab discharge — KinCare360',
    intro: 'The transition from rehab to home is high-risk. KinCare360 provides daily AI wellness calls that monitor recovery and catch complications early.'
  },
  association: {
    subject: 'Resource for your members: AI-powered daily check-ins for elderly patients',
    intro: 'We\'d love to be a resource you can share with your members. KinCare360 provides daily AI wellness check-in calls for elderly patients and their families.'
  },
  social: {
    subject: 'A tool for your care coordination toolkit — KinCare360',
    intro: 'If you work with families caring for aging loved ones, KinCare360 is a service you can recommend that actually solves the "I can\'t be there every day" problem.'
  },
  state: {
    subject: 'Affordable daily check-in service for seniors aging in place',
    intro: 'KinCare360 provides daily AI wellness check-in calls for seniors aging in place — an affordable alternative that families love.'
  }
};

const contacts = [
  { name: 'Addus HomeCare', email: 'info1@addus.com', type: 'homecare' },
  { name: 'AccentCare', email: 'DL-PCS-CA-Corona-AR-MGRs@accentcare.com', type: 'homecare' },
  { name: 'Careforth', email: 'media@careforth.com', type: 'homecare' },
  { name: 'Providence Life Services', email: 'info@provlife.com', type: 'snf' },
  { name: 'Select Rehabilitation', email: 'selectrehab@selectrehab.com', type: 'rehab' },
  { name: 'LeadingAge New York', email: 'gwilcox@leadingageny.org', type: 'association' },
  { name: 'SilverAssist', email: 'info@silverassist.com', type: 'assisted' },
  { name: 'LeadingAge National', email: 'info@leadingage.org', type: 'association' },
  { name: 'FL Dept of Elder Affairs', email: 'information@elderaffairs.org', type: 'state' },
  { name: 'NASW Membership', email: 'membership@socialworkers.org', type: 'social' },
  { name: 'NASW Advocacy', email: 'advocacy@socialworkers.org', type: 'social' },
  { name: 'NASW Media', email: 'media@socialworkers.org', type: 'social' },
];

async function send() {
  let sent = 0;
  for (const contact of contacts) {
    const t = templates[contact.type];
    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
<p>Hi,</p>
<p>${t.intro}</p>
<p><strong>What KinCare360 does:</strong></p>
<ul>
  <li><strong>Daily wellness check-in calls</strong> — our AI assistant Lily calls every morning to ask how they're feeling</li>
  <li><strong>Medication reminders</strong> — as many times per day as needed</li>
  <li><strong>Instant emergency alerts</strong> — family gets notified immediately if something's wrong</li>
  <li><strong>Family dashboard</strong> — everyone stays informed, real-time care notes</li>
</ul>
<p>Patients/families sign up directly at <a href="https://kincare360.com" style="color: #0d9488; font-weight: bold;">kincare360.com</a>. No integration required. No extra work for your staff.</p>
<p>Plans start at <strong>$50/month</strong> with a <strong>free 7-day trial</strong>. Available nationwide. No contracts.</p>
<p>Or call our AI assistant Lily directly to hear it in action: <strong>(812) 515-5252</strong></p>
<p><strong>See how it works: <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></strong></p>
<br>
<p style="color: #666;">The KinCare360 Team<br>
<a href="mailto:hello@kincare360.com" style="color: #0d9488;">hello@kincare360.com</a> | (812) 515-5252<br>
<a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></p>
</div>`;

    try {
      await transporter.sendMail({
        from: 'KinCare360 <hello@kincare360.com>',
        to: contact.email,
        subject: t.subject,
        html
      });
      console.log('OK: ' + contact.name + ' (' + contact.email + ')');
      sent++;
      await new Promise(r => setTimeout(r, 5000));
    } catch(e) {
      console.error('FAIL: ' + contact.name + ' - ' + e.message);
    }
  }
  console.log('\nTotal sent: ' + sent + '/' + contacts.length);
}
send();
