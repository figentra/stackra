/**
 * Stackra file contract:
 * Purpose: `ETA_RECEIPT_OPTIONS`, the pack options of the `eta-receipt` driver (Egypt's B2C e-receipt): the receipt
 *          submission endpoint, the status URL polled after acceptance, the share URL the receipt QR points at, the
 *          receipt type version, the issuer's activity code, the reporting currency, the tax type and subtype per
 *          UNCL 5305 category, and the receipt payment-method code per tenant payment method.
 * Boundary: a zod schema constant: the shape of pack data, not its values. Every field is required, so a pack that
 *           leaves one out is refused by `parseOptions` instead of falling back to a value in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 8; open question 1: ETA e-receipts); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `EtaReceiptDriver`. */
export const ETA_RECEIPT_OPTIONS = z.object({
  /** Where receipts are submitted. */
  submitUrl: z.url(),
  /** The receipt status URL with `{uuid}` where the receipt UUID goes, polled after an accepted submission. */
  statusUrl: z.string().includes("{uuid}"),
  /** The public receipt search URL the QR text starts with; the UUID, issue time, total and RIN follow it. */
  shareUrl: z.url(),
  /** The `typeVersion` value. */
  typeVersion: z.string().min(1),
  /** The issuer's registered activity code. */
  activityCode: z.string().min(1),
  /** The only currency this driver writes amounts in; a receipt in another currency is refused. */
  reportingCurrency: z.string().length(3),
  /** The authority's tax type and subtype per UNCL 5305 category. */
  taxTypes: z.record(
    z.string(),
    z.object({ taxType: z.string().min(1), subType: z.string().min(1) }),
  ),
  /** The receipt `paymentMethod` code per tenant payment method code. */
  paymentMethods: z.record(z.string(), z.string().min(1)),
});
