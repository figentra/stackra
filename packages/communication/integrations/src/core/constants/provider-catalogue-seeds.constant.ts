/**
 * Stackra file contract:
 * Purpose: `PROVIDER_CATALOGUE_SEEDS`, the seed rows of the provider catalogue for the `us` and `eu` payment gateways:
 *          Stripe live (bring your own over OAuth, or managed as a Figentra Pay connected account), and the planned
 *          bring-your-own gateways (Square, Adyen and PayPal in `us`; Adyen and Mollie in `eu`).
 * Boundary: seed data the registry loads and an operator edits; a market pack's `payments.byo-providers` list cites
 *           these rows. A `planned` row is listed and never served: it turns `live` when its driver ships. Wallets and
 *           pay-later in these packs are the Stripe account's enabled payment methods, not rows of their own.
 * Runtime: isomorphic
 * Governing contract: R4-4; R3-SO-04; RV-53; US-35; US-43; config-model section 6.
 */
import { ProviderSource } from "#contracts/enums/provider-source.enum";
import type { ProviderCatalogueEntry } from "#contracts/types/provider-catalogue-entry.type";

/** A planned bring-your-own payments row. */
const planned = (provider: string, pack: string): ProviderCatalogueEntry => ({
  provider,
  category: "payments",
  pack,
  status: "planned",
  sources: [ProviderSource.Byo],
  decisions: ["R4-4"],
});

/** The seed rows. */
export const PROVIDER_CATALOGUE_SEEDS: readonly ProviderCatalogueEntry[] = [
  {
    provider: "stripe",
    category: "payments",
    pack: "us",
    status: "live",
    sources: [ProviderSource.Byo, ProviderSource.Managed],
    decisions: ["R4-4", "RV-53", "US-43"],
  },
  planned("square", "us"),
  planned("adyen", "us"),
  planned("paypal", "us"),
  {
    provider: "stripe",
    category: "payments",
    pack: "eu",
    status: "live",
    sources: [ProviderSource.Byo, ProviderSource.Managed],
    decisions: ["R4-4", "R3-SO-04"],
  },
  planned("adyen", "eu"),
  planned("mollie", "eu"),
];
