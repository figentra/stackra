/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/payments, the commerce module UI kit's cart and checkout
 *          blocks (`Cart`, `Checkout` and their Props) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; the blocks depend on @stackra/ui, never the reverse (ADR 0503).
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { Cart } from "#react/cart/cart";
export type { CartProps } from "#react/cart/cart.props";
export { Checkout } from "#react/checkout/checkout";
export type { CheckoutProps } from "#react/checkout/checkout.props";
export type { OrderTotalsProps } from "#react/order-totals/order-totals.props";
