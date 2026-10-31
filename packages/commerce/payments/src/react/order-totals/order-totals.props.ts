/**
 * Stackra file contract:
 * Purpose: `OrderTotalsProps`, the totals rows the Cart and Checkout blocks share: subtotal, shipping, tax and total
 *          as the host's pricing evaluated them.
 * Boundary: an interface in its own file (ADR 0305); the blocks compute no tax, shipping or discount.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits).
 */

/**
 * The rows; the one marked `isTotal` is set larger, under a rule.
 *
 * @example
 * <OrderTotals totals={[{ id: "total", label: "Total", amount: { amount: 120, currency: "SAR" }, isTotal: true }]} />
 */
export interface OrderTotalsProps {
  readonly totals: readonly {
    readonly id: string;
    readonly label: string;
    readonly amount: { readonly amount: number; readonly currency: string };
    readonly isTotal?: boolean | undefined;
  }[];
}
