const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'hello@kincare360.com',
    pass: 'rogvowrocfhdsasp'
  }
});

const subject = 'Is your elderly loved one living alone? Daily AI check-ins starting at $99/month';
const body = `Hi,

If you have an elderly parent or loved one living alone, you know the daily worry — Did they take their medication? Are they okay? What if something happens and no one's there?

KinCare360 gives families peace of mind every single day.

Our AI, Lily, calls your loved one daily to:
- Check in and make sure they're doing well
- Remind them about their medications
- Alert your whole family immediately if something seems wrong
- Coordinate with their doctors when needed

No nursing home. No uprooting their life. Just daily care and connection — from home.

7-day free trial. No credit card until day 8.

See how it works: kincare360.com

The KinCare360 Team
hello@kincare360.com | (812) 515-5252`;

const targets = [
  { email: 'info@chosenfamilyhomecare.com', name: 'Chosen Family Home Care' },
  { email: 'info@goodhandshomecarellc.com', name: 'Good Hands Home Care' },
  { email: 'info@stayathomehc.com', name: 'Stay At Home Homecare' },
];

async function send(to, name) {
  try {
    await transporter.sendMail({
      from: '"KinCare360" <hello@kincare360.com>',
      to,
      subject,
      text: body
    });
    console.log('SENT:', to, '-', name);
  } catch(e) {
    console.log('FAILED:', to, '-', name, '|', e.message);
  }
}

(async () => {
  for (const t of targets) {
    await send(t.email, t.name);
    await new Promise(r => setTimeout(r, 3000));
  }
  console.log('Done.');
})();
