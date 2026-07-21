import "server-only";

/**
 * Merchant-of-record GST config. Tax is OFF by default (rate 0) — the platform
 * collects no GST until it registers, a CA confirms rate/SAC, and these env vars
 * are set. When enabled, `GST_INCLUSIVE` (default true) decides whether the
 * displayed price already includes tax (carved out) or tax is added on top.
 *
 * DO NOT treat any rate/SAC here as tax advice — they are operator-supplied config.
 */
export interface TaxConfig {
  gstRateBps: number; // e.g. 1800 = 18%
  sacCode: string | null;
  platformGstin: string | null;
  inclusive: boolean;
}

export function getTaxConfig(): TaxConfig {
  const rate = Number(process.env.GST_RATE_BPS ?? 0);
  return {
    gstRateBps: Number.isFinite(rate) && rate > 0 ? Math.round(rate) : 0,
    sacCode: process.env.GST_SAC_CODE?.trim() || null,
    platformGstin: process.env.PLATFORM_GSTIN?.trim() || null,
    inclusive: process.env.GST_INCLUSIVE !== "false",
  };
}

export interface TaxSplit {
  taxableValuePaise: number;
  taxPaise: number;
  gstRateBps: number;
  sacCode: string | null;
}

/**
 * Splits an order amount into taxable value + GST per the current config.
 * With tax OFF (rate 0) this is a no-op: taxable = amount, tax = 0 — so existing
 * pricing is unchanged until GST is deliberately enabled.
 *
 * `amountPaise` is the price the student pays. Inclusive: tax is carved out of it.
 * Exclusive: tax is on top, so the caller must charge amount + tax (see note in
 * createOrderAction) — kept explicit so enabling exclusive tax is a conscious change.
 */
export function splitTax(amountPaise: number, cfg: TaxConfig = getTaxConfig()): TaxSplit {
  if (cfg.gstRateBps <= 0) {
    return { taxableValuePaise: amountPaise, taxPaise: 0, gstRateBps: 0, sacCode: cfg.sacCode };
  }
  if (cfg.inclusive) {
    const taxable = Math.round((amountPaise * 10000) / (10000 + cfg.gstRateBps));
    return { taxableValuePaise: taxable, taxPaise: amountPaise - taxable, gstRateBps: cfg.gstRateBps, sacCode: cfg.sacCode };
  }
  const tax = Math.round((amountPaise * cfg.gstRateBps) / 10000);
  return { taxableValuePaise: amountPaise, taxPaise: tax, gstRateBps: cfg.gstRateBps, sacCode: cfg.sacCode };
}
