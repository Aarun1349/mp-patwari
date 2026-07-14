import "server-only";

/**
 * Sends the OTP SMS. Prefers Twilio Programmable SMS (same Twilio account as
 * top-app-backend); falls back to MSG91 if that's what's configured, and
 * finally to a dev console log so the auth flow is exercisable locally before
 * any provider is set up.
 *
 * Plain fetch, no vendor SDK — matches the rest of this codebase.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM;

  if (twilioSid && twilioToken && twilioFrom) {
    // App stores 10-digit Indian numbers; Twilio needs E.164.
    const to = phone.startsWith("+") ? phone : `+91${phone}`;
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: twilioFrom,
        Body: `${code} is your ExamsExpress verification code. Valid for 5 minutes. Do not share it.`,
      }).toString(),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Twilio SMS send failed (${res.status}): ${body}`);
    }
    return;
  }

  // Legacy fallback: MSG91.
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (authKey && templateId) {
    const res = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", authkey: authKey },
      body: JSON.stringify({ template_id: templateId, mobile: phone, otp: code }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`MSG91 OTP send failed (${res.status}): ${body}`);
    }
    return;
  }

  // No provider configured — log for local dev.
  console.log(`[dev-otp] OTP for ${phone}: ${code}`);
}
