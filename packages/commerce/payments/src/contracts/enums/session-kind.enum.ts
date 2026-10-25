/**
 * Stackra file contract:
 * Purpose: `SessionKind`, how the customer reaches a checkout session: a page to redirect to, or a provider widget
 *          script the product's own page loads (hosted fields).
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. Both keep card data off the
 *           platform (PCI SAQ-A). Codes are snake_case.
 * Runtime: isomorphic
 * Governing contract: ADR 0357 (decision 5: hosted fields or redirect only); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * Redirect or widget.
 *
 * @example
 * if (session.kind === SessionKind.Redirect) location.assign(session.url);
 */
export const SessionKind = Enum.of({
  /** `url` is a provider page; send the customer there. */
  Redirect: "redirect",
  /** `url` is a provider script; load it on the product's page. */
  Widget: "widget",
});

/** One of the codes above. */
export type SessionKind = Enum.Value<typeof SessionKind>;
