import "server-only";

/**
 * Sends the OTP via MSG91. In dev, if MSG91_AUTH_KEY isn't configured,
 * logs the code to the server console instead of failing — lets the whole
 * auth flow be exercised locally before MSG91/DLT registration is done.
 */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.log(`[dev-otp] OTP for ${phone}: ${code}`);
    return;
  }

  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile: phone,
      otp: code,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MSG91 OTP send failed (${res.status}): ${body}`);
  }
}
