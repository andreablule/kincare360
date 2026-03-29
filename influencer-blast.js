const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hello@kincare360.com', pass: 'rogv owro cfhd sasp' }
});

const contacts = [
  // Podcasts
  { name: 'Happy Healthy Caregiver (Elizabeth Miller)', email: 'info@happyhealthycaregiver.com', type: 'podcast' },
  { name: 'Teepa Snow (Dementia Care)', email: 'podcast@teepasnow.com', type: 'podcast' },
  { name: 'Caregiving Club (Sherri Snelling)', email: 'info@caregivingclub.com', type: 'podcast' },
  { name: 'Whole Care Network', email: 'info@wholecarenetwork.com', type: 'podcast' },
  { name: 'Pamela D. Wilson', email: 'info@pameladwilson.com', type: 'podcast' },
  { name: 'Senior Care Live', email: 'info@seniorcarelive.com', type: 'podcast' },
  { name: 'CareGiving.com', email: 'info@caregiving.com', type: 'podcast' },
  // Influencers & Bloggers
  { name: 'Caregiver Dave (Dave Nassaney)', email: 'info@caregiverdave.com', type: 'influencer' },
  { name: 'Caring Village', email: 'info@caringvillage.com', type: 'influencer' },
  { name: 'The Caregiver Space (151K followers)', email: 'info@thecaregiverspace.org', type: 'influencer' },
  { name: 'BK Books (Barbara Karnes)', email: 'info@bkbooks.com', type: 'influencer' },
  { name: 'Kim Campbell CareLiving', email: 'info@careliving.org', type: 'influencer' },
  { name: 'Caregiver Warrior', email: 'info@caregiverwarrior.com', type: 'influencer' },
  { name: 'The Caregivers Voice (Brenda Avadian)', email: 'info@thecaregiversvoice.com', type: 'influencer' },
  { name: 'Advocate for Mom & Dad', email: 'info@advocateformomanddad.com', type: 'influencer' },
  { name: 'ElderCare ABC', email: 'info@eldercareabcblog.com', type: 'influencer' },
  { name: 'Dr. Macie P. Smith (39.5K YouTube)', email: 'info@bookdrmacie.com', type: 'influencer' },
  // Big platforms
  { name: 'A Place for Mom (306K FB followers)', email: 'info@aplaceformom.com', type: 'platform' },
  { name: 'Today\'s Caregiver Magazine', email: 'info@caregiver.com', type: 'media' },
];

function getEmail(contact) {
  if (contact.type === 'podcast') {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.7; color: #333;">
<p>Hi there,</p>

<p>I love what you're doing for the caregiver community and I have a story I think your listeners would connect with.</p>

<p>I spent 5 years as a CNA caring for elderly patients. Every day I saw what happened when families couldn't be there — missed medications, forgotten meals, falls that went unreported for hours.</p>

<p>So I built <strong>KinCare360</strong> — an AI care assistant named Lily who calls aging parents <strong>every single morning</strong> to check on them, remind medications, and alert the family if anything seems off.</p>

<p>It's not a medical device or an app to install. It's just a daily phone call — like having a caring friend check in. Plans start at $50/month with a free 7-day trial.</p>

<p>I'd love to be a guest on your show to talk about:</p>
<ul>
  <li>What I learned in 5 years of hands-on elderly care</li>
  <li>How AI is changing daily care coordination</li>
  <li>Practical tips families can use TODAY to keep aging parents safe</li>
</ul>

<p>Your listeners can even try it right now — just call <strong>(812) 515-5252</strong> and Lily will answer.</p>

<p><strong>Website:</strong> <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></p>

<p>Would you be open to a conversation?</p>

<p style="color: #666;">The KinCare360 Team<br>
<a href="mailto:hello@kincare360.com" style="color: #0d9488;">hello@kincare360.com</a> | (812) 515-5252</p>
</div>`;
  } else {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.7; color: #333;">
<p>Hi,</p>

<p>I follow your work and love what you do for the caregiver community. I'm reaching out because I think KinCare360 could genuinely help your audience.</p>

<p>After 5 years as a CNA, I built an AI care assistant called Lily that calls aging parents every morning to check how they're feeling, remind medications, and alert family if something seems wrong.</p>

<p>No apps. No devices. Just a daily phone call that gives families peace of mind.</p>

<p>I'm not looking for paid promotion — just wondering if you'd be open to trying it yourself and sharing with your community if you think it's genuinely helpful.</p>

<p>Your audience can call Lily right now at <strong>(812) 515-5252</strong> to hear what a check-in sounds like.</p>

<ul>
  <li>Plans from <strong>$50/month</strong></li>
  <li><strong>7-day free trial</strong></li>
  <li>No contracts, cancel anytime</li>
</ul>

<p>We'd also be happy to offer your followers an <strong>extended 14-day free trial</strong> as a special partner offer — if that interests you.</p>

<p><strong>Website:</strong> <a href="https://kincare360.com" style="color: #0d9488;">kincare360.com</a></p>

<p>Thank you for the work you do. It matters.</p>

<p style="color: #666;">The KinCare360 Team<br>
<a href="mailto:hello@kincare360.com" style="color: #0d9488;">hello@kincare360.com</a> | (812) 515-5252</p>
</div>`;
  }
}

async function send() {
  let sent = 0;
  for (const contact of contacts) {
    const subject = contact.type === 'podcast'
      ? 'Guest pitch: CNA turned AI founder — a story your listeners need to hear'
      : 'Would your audience benefit from daily AI check-in calls for aging parents?';
    try {
      await transporter.sendMail({
        from: 'KinCare360 <hello@kincare360.com>',
        to: contact.email,
        subject,
        html: getEmail(contact)
      });
      console.log('OK: ' + contact.name + ' (' + contact.email + ') [' + contact.type + ']');
      sent++;
      await new Promise(r => setTimeout(r, 5000));
    } catch(e) {
      console.error('FAIL: ' + contact.name + ' - ' + e.message);
    }
  }
  console.log('\nTotal sent: ' + sent + '/' + contacts.length);
}
send();
