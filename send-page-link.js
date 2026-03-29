const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'hello@kincare360.com', pass: 'rogv owro cfhd sasp' }
});

transporter.sendMail({
  from: 'KinCare360 <hello@kincare360.com>',
  to: 'andreablule@gmail.com',
  subject: 'Your KinCare360 Facebook Page Link',
  html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6;">
<h2 style="color: #0d9488;">Your KinCare360 Facebook Page</h2>
<p>Here's your direct link:</p>
<p style="font-size: 18px;"><strong><a href="https://www.facebook.com/profile.php?id=61575170489498" style="color: #0d9488;">https://www.facebook.com/profile.php?id=61575170489498</a></strong></p>
<p>Backup link: <a href="https://www.facebook.com/1010909462116192" style="color: #0d9488;">https://www.facebook.com/1010909462116192</a></p>
<p><strong>To do:</strong></p>
<ul>
<li>Open this link from your personal Facebook</li>
<li>Click "Like" and "Follow" on the page</li>
<li>Pin the Welcome post (click ... on the post, then Pin to Top)</li>
<li>Add profile photo and cover photo</li>
<li>Share the page to your personal timeline</li>
</ul>
<p>- Lior</p>
</div>
`
}).then(() => console.log('Email sent!')).catch(e => console.error('Failed:', e.message));
