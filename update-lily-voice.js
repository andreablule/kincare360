const https = require('https');

const VAPI_KEY = '3e6bdfb6-fc6f-4c60-a584-16cfa60e6846';

// Elderly-friendly voice settings:
// speed: 0.85 = ~15% slower than default (clear, unhurried)
// stability: 0.7 = consistent, calm tone (less variation = easier to follow)
// similarityBoost: 0.75 = keeps voice natural
// style: 0.3 = warm but not overly expressive (easier to process)
const voiceSettings = {
  voiceId: "paula",
  provider: "11labs",
  speed: 0.85,
  stability: 0.75,
  similarityBoost: 0.75,
  style: 0.2,
  useSpeakerBoost: true  // louder/clearer
};

// Also update silence timeout — elderly users need more time to respond
const extraSettings = {
  silenceTimeoutSeconds: 15,    // default is ~5-7, give 15 seconds before timing out
  responseDelaySeconds: 1.5,    // small pause before Lily responds (feels less rushed)
  llmRequestDelaySeconds: 0.5,
};

function updateAssistant(assistantId, name) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      voice: voiceSettings,
      silenceTimeoutSeconds: extraSettings.silenceTimeoutSeconds,
      responseDelaySeconds: extraSettings.responseDelaySeconds,
    });

    const options = {
      hostname: 'api.vapi.ai',
      path: `/assistant/${assistantId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    let data = '';
    const req = https.request(options, (res) => {
      res.on('data', d => data += d);
      res.on('end', () => {
        const result = JSON.parse(data);
        if (result.id) {
          console.log(`✅ Updated: ${name}`);
          console.log(`   Speed: ${result.voice?.speed} | Silence timeout: ${result.silenceTimeoutSeconds}s`);
        } else {
          console.log(`❌ Failed: ${name}`, data.substring(0, 200));
        }
        resolve(result);
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  console.log('Updating Lily voice settings for elderly-friendly experience...\n');
  await updateAssistant('8dc06b99-9533-4b28-b379-7ed4f07768aa', 'Lily - KinCare360 Concierge');
  await updateAssistant('bb32dead-7738-4ec9-9c51-57181465b5f2', 'KinCare360 Daily Check-In Agent');
  console.log('\nDone. Lily will now speak slower, pause longer, and give users more time to respond.');
})();
