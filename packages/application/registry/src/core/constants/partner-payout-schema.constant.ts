/**
 * Stackra file contract:
 * Purpose: `PARTNER_PAYOUT_SCHEMA`, the shipped zod schema of `PartnerPayout`: the partner, the app, the period, the
 *          currency, the gross, fee and net in minor units, and the fee schedule applied.
 * Boundary: internal; `partner-payout.schema.ts` registers it. The period is a calendar month, `YYYY-MM`; the net is
 *           the gross less the fee, checked here.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8: partner payout records).
 */
import { z } from "zod";

/** The shipped `PartnerPayout$`. */
export const PARTNER_PAYOUT_SCHEMA = z
  .object({
    partner: z.string().min(1),
    app: z.string().min(1),
    period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "must be a month, YYYY-MM"),
    currency: z.string().regex(/^[A-Z]{3}$/, "must be an ISO 4217 code"),
    grossMinor: z.int().min(0),
    feeMinor: z.int().min(0),
    netMinor: z.int().min(0),
    schedule: z.string().min(1),
  })
  .refine((payout) => payout.netMinor === payout.grossMinor - payout.feeMinor, {
    message: "netMinor must be grossMinor less feeMinor",
    path: ["netMinor"],
  });
