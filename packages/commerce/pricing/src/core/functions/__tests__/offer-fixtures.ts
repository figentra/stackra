/**
 * Stackra file contract:
 * Purpose: test offers shared by the offer tests: a founding offer, a startup offer and an annual discount, parsed
 *          from rows standing in for `offer:<name>` seed records.
 * Boundary: test data only; the percentages are placeholders, not owner prices.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393.
 */
import { offerOf } from "#core/functions/offer-of.function";
import type { CatalogueOffer } from "#core/types/catalogue-offer.type";

/** The three test offers, by name. */
export const OFFERS: Readonly<Record<"founding" | "startup" | "annual", CatalogueOffer>> = {
  founding: offerOf("offer:founding", [
    { id: "p", record: "benefit", kind: "percent", basisPoints: 4_500, months: null },
    { id: "e", record: "eligibility", packs: ["ae"], products: ["academorix"] },
  ]),
  startup: offerOf("offer:startup", [
    { id: "p", record: "benefit", kind: "percent", basisPoints: 5_000, months: 12 },
    {
      id: "ai",
      record: "benefit",
      kind: "credit_grant",
      credit: "ai",
      units: 500,
      period: "month",
      months: 12,
    },
    { id: "crm", record: "benefit", kind: "module_grant", module: "crm", months: 12 },
    { id: "move", record: "benefit", kind: "free_migration" },
    {
      id: "e",
      record: "eligibility",
      packs: ["ae", "eg"],
      products: ["commerce"],
      ruleSet: "rule-set:os:startup-perk-eligibility",
      capPerPack: { eg: 2 },
    },
  ]),
  annual: offerOf("offer:annual", [
    { id: "p", record: "benefit", kind: "percent", basisPoints: 2_000, months: null },
    { id: "e", record: "eligibility", packs: ["ae", "eg"], products: ["commerce", "academorix"] },
  ]),
};
