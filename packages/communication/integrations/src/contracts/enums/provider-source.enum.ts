/**
 * Stackra file contract:
 * Purpose: `ProviderSource`, whose account a Connection acts on: `managed` (Figentra's platform key and a per-tenant
 *          resource on Figentra's account: a Twilio subaccount, a Stripe connected account, a sending domain) or `byo`
 *          (the tenant's own account and key).
 * Boundary: an `Enum.of` value plus the type of the same name. Which sources a provider category offers in a Market is
 *           data (`provider-category:<name>` records and market packs); the code only carries the word. A connection
 *           that names none is `byo`.
 * Runtime: isomorphic
 * Governing contract: cross-product answers (managed or bring your own); R3-SO-03; R3-CE-13; ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * Managed or bring-your-own.
 *
 * @example
 * await store.connect(TwilioConnection, { fields, source: ProviderSource.Managed, resourceId: "AC123" });
 */
export const ProviderSource = Enum.of({
  /** Figentra's platform key and a per-tenant resource on Figentra's account; fees pass through as cost events. */
  Managed: "managed",
  /** The tenant's own account and key; the provider bills the tenant. */
  Byo: "byo",
});

/** One of the codes above. */
export type ProviderSource = Enum.Value<typeof ProviderSource>;
