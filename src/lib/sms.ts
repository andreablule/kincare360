export function digits(value = "") {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

export function formatUsPhone(value = "") {
  const d = digits(value);
  return d.length === 10 ? `+1${d}` : value;
}

export async function sendSMS(to: string, text: string) {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_PHONE_NUMBER;

  if (!apiKey || !from) {
    console.warn("[sms] Telnyx SMS skipped; missing TELNYX_API_KEY or TELNYX_PHONE_NUMBER.");
    return { ok: false, skipped: true, error: "Telnyx SMS is not configured" };
  }

  const response = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: formatUsPhone(to),
      text,
    }),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    console.error("[sms] Telnyx SMS failed", data);
  }

  return { ok: response.ok, skipped: false, data };
}
