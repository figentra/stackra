/**
 * Stackra file contract:
 * Purpose: a valid perk listing shared by the perk tests, standing in for an OS admin record.
 * Boundary: test data only; the partner, packs and links are placeholders.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1).
 */

/** A code perk listed in two packs for one product. */
export const PERK = {
  key: "perk-shipping",
  partner: "dev_01j9z3k4m5n6p7q8r9s0t1v2w1",
  state: "approved",
  redemption: "code",
  code: "WELCOME",
  packs: ["ae", "eg"],
  products: ["commerce"],
  termsUrl: "https://partner.example/terms",
  feeSchedule: "perk-listing",
} as const;
