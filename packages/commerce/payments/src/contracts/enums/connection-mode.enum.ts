/**
 * Stackra file contract:
 * Purpose: `ConnectionMode`, how a payments Connection reaches the money: `oauth-standard` (the merchant's own
 *          provider account connected over OAuth, BYO Stripe Standard or Square: no platform fee, revocable by the
 *          merchant), `own-key` (the merchant's own provider key: Moyasar, HyperPay, Paymob, Fawry, Adyen, PayPal), `connected-account` (a
 *          Figentra Pay account under the platform, on `fee-schedule:pay`, where the pre-verification cap and the
 *          payout hold apply). A fourth, `legacy-connected-account:<platform>`, is `LegacyConnectedAccountMode`.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The codes keep the owner's spelling
 *           (R4-6, A3-1) because market packs and connection records carry them as data. Which mode a Market offers is
 *           pack data; a connection's mode is its `mode` field.
 * Runtime: isomorphic
 * Governing contract: R4-6; R4-4; A3-1; ACA-542; STA-687; M3-2; RV-43; US-43; ADR 0231 (a value owned elsewhere keeps its spelling).
 */
import { Enum } from "@stackra/contracts";

/**
 * The fixed connection modes.
 *
 * @example
 * if (modeOf(gateway) === ConnectionMode.ConnectedAccount) await this.withinCap(gateway, amount);
 */
export const ConnectionMode = Enum.of({
  /** The merchant's own provider account over OAuth (Stripe Standard, Square): no platform fee, revocable. */
  OAuthStandard: "oauth-standard",
  /** The merchant's own key at a provider without OAuth; the default of a connection that names no mode. */
  OwnKey: "own-key",
  /** A Figentra Pay account under the platform: the pre-verification cap and the payout hold apply. */
  ConnectedAccount: "connected-account",
});

/** One of the codes above. */
export type ConnectionMode = Enum.Value<typeof ConnectionMode>;
