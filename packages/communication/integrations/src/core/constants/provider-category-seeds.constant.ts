/**
 * Stackra file contract:
 * Purpose: `PROVIDER_CATEGORY_SEEDS`, the seed `provider-category:<name>` records of the X2-36 registry: for each
 *          provider category, the sources it offers (managed, bring-your-own or both), the price record of a managed
 *          resource, the BYO fee and the workflow template that provisions a managed resource.
 * Boundary: seed data, loaded by the registry and edited by an operator afterwards; nothing here reads it at run time.
 *           Prices live on the named rate cards and fee schedules (placeholders until the cost model, OS-378); which
 *           sources a Market allows is market-pack data. Payroll's connector-or-export split (M3-11) is BYO only here:
 *           an export needs no provider. App stores are BYO only too:
 *           without the merchant's store account, Runway publishes under Figentra's, which needs no Connection (D14).
 * Runtime: isomorphic
 * Governing contract: R3-CE-13; R3-SO-03; M3-4; M3-11; M3-13; M3-17; RV-14; D14; config-model section 6.
 */
import { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { ProviderCategoryRecord } from "#contracts/types/provider-category-record.type";

/** Both sources, managed first. */
const BOTH = [ProviderSource.Managed, ProviderSource.Byo] as const;

/** The managed part of category `name`, billed on `pricing`. */
const managed = (
  name: string,
  pricing: `${"rate-card" | "fee-schedule"}:${string}`,
): NonNullable<ProviderCategoryRecord["managed"]> => ({
  pricing,
  provisioning: `workflow-template:os:managed-provisioning:${name}`,
});

/** The seed records, one per category. */
export const PROVIDER_CATEGORY_SEEDS: readonly ProviderCategoryRecord[] = [
  {
    key: "provider-category:payments",
    name: "payments",
    sources: BOTH,
    managed: managed("payments", "fee-schedule:pay"),
    decisions: ["R3-CE-13", "RV-43", "US-43", "R4-6"],
  },
  {
    key: "provider-category:shipping",
    name: "shipping",
    sources: BOTH,
    managed: managed("shipping", "rate-card:shipping"),
    byoPricing: "rate-card:byo",
    decisions: ["R3-CE-13", "RV-14"],
  },
  {
    key: "provider-category:messaging",
    name: "messaging",
    sources: BOTH,
    managed: managed("messaging", "rate-card:messaging"),
    byoPricing: "rate-card:byo",
    decisions: ["R3-CE-13", "R3-SO-03", "US-106"],
  },
  {
    key: "provider-category:tax",
    name: "tax",
    sources: BOTH,
    managed: managed("tax", "rate-card:tax"),
    decisions: ["M3-4", "US-46"],
  },
  {
    key: "provider-category:edi",
    name: "edi",
    sources: BOTH,
    managed: managed("edi", "rate-card:edi"),
    byoPricing: "rate-card:byo",
    decisions: ["M3-17", "R3-SO-07"],
  },
  {
    key: "provider-category:routing",
    name: "routing",
    sources: BOTH,
    managed: managed("routing", "rate-card:routing"),
    byoPricing: "rate-card:byo",
    decisions: ["R3-CE-13", "GRO-129"],
  },
  {
    key: "provider-category:telephony",
    name: "telephony",
    sources: [ProviderSource.Managed],
    managed: managed("telephony", "rate-card:telephony"),
    decisions: ["R3-CE-13", "RV-51"],
  },
  {
    key: "provider-category:delivery-middleware",
    name: "delivery-middleware",
    sources: [ProviderSource.Managed],
    managed: managed("delivery-middleware", "rate-card:delivery-middleware"),
    decisions: ["R3-CE-13", "RES-164"],
  },
  {
    key: "provider-category:tenant-verification",
    name: "tenant-verification",
    sources: [ProviderSource.Managed],
    managed: managed("tenant-verification", "rate-card:tenant-verification"),
    decisions: ["M3-13", "RV-9", "RV-10"],
  },
  {
    key: "provider-category:customer-checks",
    name: "customer-checks",
    sources: BOTH,
    managed: managed("customer-checks", "rate-card:customer-checks"),
    byoPricing: "rate-card:byo",
    decisions: ["M3-13"],
  },
  {
    key: "provider-category:ebt",
    name: "ebt",
    sources: [ProviderSource.Byo],
    byoPricing: "rate-card:byo",
    decisions: ["R3-CE-13", "GRO-182"],
  },
  {
    key: "provider-category:payroll",
    name: "payroll",
    sources: [ProviderSource.Byo],
    byoPricing: "rate-card:byo",
    decisions: ["M3-11", "RV-50", "OS-217"],
  },
  {
    key: "provider-category:fulfilment",
    name: "fulfilment",
    sources: [ProviderSource.Byo],
    byoPricing: "rate-card:byo",
    decisions: ["R3-CE-13", "COM-113"],
  },
  {
    // shortcut: Figentra's account (D14 managed) is Runway's default with no Connection, so no managed resource here;
    // add `managed` with a provisioning template if publishing under Figentra's account ever needs one.
    key: "provider-category:app-stores",
    name: "app-stores",
    sources: [ProviderSource.Byo],
    decisions: ["D14"],
  },
];
