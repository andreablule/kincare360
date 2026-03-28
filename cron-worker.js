// KinCare360 Reminder Cron — hits /api/send-reminders every 60 seconds
const https = require('https');

function getEtTime() {
  return new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: true });
}

function ping() {
  const start = Date.now();
  const req = https.get('https://www.kincare360.com/api/send-reminders', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const ms = Date.now() - start;
      try {
        const json = JSON.parse(data);
        const totalSent = (json.medReminders || 0) + (json.dailyCheckins || 0);
        if (totalSent > 0) {
          console.log(`[${getEtTime()}] ✅ CALLS SENT: ${totalSent} | ${JSON.stringify(json.sent)}`);
        } else if (json.skipped > 0) {
          console.log(`[${getEtTime()}] ⏭️ Skipped: ${json.skipped} (dedup)`);
        } else {
          // Log every ping so we know cron is alive
          console.log(`[${getEtTime()}] ⏳ No calls due | time: ${json.time} | ${ms}ms`);
        }
      } catch(e) {
        console.error(`[${getEtTime()}] ❌ Parse error:`, data.slice(0, 200));
      }
    });
  });
  req.on('error', (e) => {
    console.error(`[${getEtTime()}] ❌ Request failed:`, e.message);
  });
  req.setTimeout(15000, () => {
    console.error(`[${getEtTime()}] ❌ Timeout`);
    req.destroy();
  });
}

console.log(`[${getEtTime()}] KinCare360 Cron Worker started — pinging every 60s`);
ping(); // Run immediately

const interval = setInterval(() => {
  ping();
}, 60000);

// Keep process alive
process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('Cron stopped.');
  process.exit(0);
});
