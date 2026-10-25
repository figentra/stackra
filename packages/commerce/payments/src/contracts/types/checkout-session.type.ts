/**
 * Stackra file contract:
 * Purpose: `CheckoutSession`, an open checkout at the provider: its id there, how the customer reaches it and until when.
 * Boundary: a type in the leaf entry; the URL is a provider page or script, so no card data reaches the platform.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5).
 */
import type { SessionKind } from "#contracts/enums/session-kind.enum";

/**
 * Where the customer pays.
 *
 * @example
 * const session = await payments.checkout(market, request);
 * if (session.kind === SessionKind.Redirect) redirect(session.url);
 */
export interface CheckoutSession {
  /** The provider's id of the session or payment. */
  readonly providerRef: string;

  /** A page to redirect to or a widget script to load. */
  readonly kind: SessionKind;

  /** The page or script URL. */
  readonly url: string;

  /** When the session closes, when the provider says. */
  readonly expiresAt?: Date;
}
