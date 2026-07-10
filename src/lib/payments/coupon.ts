import "server-only";
import type { Coupon, Package } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class InvalidCouponError extends Error {}

export interface PricedCoupon {
  coupon: Coupon;
  discountPaise: number;
  finalAmountPaise: number;
}

export async function validateAndPriceCoupon(rawCode: string, pkg: Package): Promise<PricedCoupon> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) throw new InvalidCouponError("Invalid coupon code.");

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) throw new InvalidCouponError("This coupon isn't active yet.");
  if (coupon.validUntil && now > coupon.validUntil) throw new InvalidCouponError("This coupon has expired.");
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new InvalidCouponError("This coupon has already been fully redeemed.");
  }

  const discountPaise =
    coupon.discountType === "percent"
      ? Math.round((pkg.pricePaise * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, pkg.pricePaise);

  const finalAmountPaise = Math.max(0, pkg.pricePaise - discountPaise);

  return { coupon, discountPaise, finalAmountPaise };
}
