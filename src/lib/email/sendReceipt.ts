import "server-only";

export interface ReceiptParams {
  to: string;
  userName: string | null;
  packageName: string;
  testCount: number;
  amountPaise: number;
  orderId: string;
}

/**
 * Sends a purchase receipt via Resend. In dev, if RESEND_API_KEY isn't
 * configured, logs to console instead of failing — same graceful-degradation
 * pattern as sendOtpSms.
 */
export async function sendReceiptEmail(params: ReceiptParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const amount = (params.amountPaise / 100).toFixed(2);

  if (!apiKey || !fromEmail) {
    console.log(
      `[dev-receipt] Order ${params.orderId}: ${params.packageName} (${params.testCount} tests, ₹${amount}) → ${params.to}`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: params.to,
      subject: "Your ExamsExpress purchase receipt",
      html: `
        <p>Hi ${params.userName ?? "there"},</p>
        <p>Thanks for your purchase. Here are your order details:</p>
        <ul>
          <li>Package: ${params.packageName}</li>
          <li>Tests added: ${params.testCount}</li>
          <li>Amount paid: ₹${amount}</li>
          <li>Order ID: ${params.orderId}</li>
        </ul>
        <p>You can view your tests remaining on your dashboard.</p>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}
