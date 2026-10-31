/**
 * Stackra file contract:
 * Purpose: `CartProps`, what a host hands the Cart block: the lines, the evaluated totals, the handlers and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). Lines, prices, totals and copy are the host's
 *           data; the block multiplies a unit price by its quantity for the line and computes nothing else.
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0305 (`<name>.props.ts`).
 */
import type { OrderTotalsProps } from "#react/order-totals/order-totals.props";

/** One cart line. */
interface CartLine {
  readonly id: string;
  readonly name: string;
  /** The variant: "Size M · Sand". */
  readonly detail?: string | undefined;
  /** The product image URL. */
  readonly image?: string | undefined;
  readonly unitPrice: { readonly amount: number; readonly currency: string };
  readonly quantity: number;
  /** Stock or a per-order limit. */
  readonly maxQuantity?: number | undefined;
}

/**
 * The cart's lines and totals.
 *
 * @example
 * <Cart lines={lines} totals={totals} labels={labels} onQuantityChange={set} onRemove={remove} onCheckout={go} />
 */
export interface CartProps {
  readonly lines: readonly CartLine[];
  /** The rows under the lines, from the host's pricing (subtotal, shipping, tax, total). */
  readonly totals: OrderTotalsProps["totals"];
  readonly onQuantityChange: (lineId: string, quantity: number) => void;
  readonly onRemove: (lineId: string) => void;
  readonly onCheckout: () => void;
  /** True while the host starts checkout: the button spins. */
  readonly isCheckingOut?: boolean | undefined;
  readonly labels: {
    readonly title: string;
    /** Shown instead of the lines when there are none. */
    readonly empty: string;
    /** The stepper's accessible name for a line: "Quantity of Linen abaya" (the host formats its own message). */
    readonly quantity: (lineName: string) => string;
    readonly remove: string;
    readonly checkout: string;
  };
  readonly className?: string | undefined;
}
