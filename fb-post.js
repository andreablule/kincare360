const https = require('https');

const pageToken = "EAA4OGi2dgP0BRDmJLwaq6KKdYTaM3OBifIbNuRxgwdHejhSZAr27I0TyiafXPXztUT9vl2j0pE2cG0tWGkUfQkV3ktND2yrysdDmliGPER2wdw9eEKX0aZA4jl5yRZCun0mSvSmFLsKdKchq2S5fyEzvQwsRZBiF2eelwvUPD3ChnFTjOXQnWRsE1B8Kt8P5EHEU";
const pageId = "1010909462116192";

const msg = `Welcome to KinCare360!

We built an AI care assistant that calls your aging parent every single morning to check how they're feeling, remind medications, and alert your family if anything seems wrong.

No apps. No devices. Just a daily phone call that gives you peace of mind.

Plans start at $50/month. 7-day free trial. No contracts.

Try it free at kincare360.com
Or call Lily right now: (812) 515-5252

#KinCare360 #ElderCare #AgingParents #SeniorCare #CaregiverSupport`;

// Use form-encoded POST
const postData = `message=${encodeURIComponent(msg)}&link=${encodeURIComponent('https://kincare360.com')}&access_token=${encodeURIComponent(pageToken)}`;

const options = {
  hostname: 'graph.facebook.com',
  path: `/v19.0/${pageId}/feed`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});
req.on('error', e => console.error('Error:', e.message));
req.write(postData);
req.end();
