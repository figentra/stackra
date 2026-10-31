/**
 * Stackra file contract:
 * Purpose: `CheckoutProps`, what a host hands the Checkout block: the form sections and their fields, the shipping
 *          options, the payment methods, the order summary and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). Fields, options, methods and prices are data
 *           a market pack or the tenant's settings decide (an address has the fields its country needs); the block
 *           hard-codes none of them.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0305 (`<name>.props.ts`).
 */
import type { OrderTotalsProps } from "#react/order-totals/order-totals.props";

/** An amount in a currency. */
interface Amount {
  readonly amount: number;
  readonly currency: string;
}

/** One form section: "Contact", "Delivery address". */
interface CheckoutSection {
  readonly id: string;
  readonly title: string;
  readonly fields: readonly {
    /** The submitted name. */
    readonly id: string;
    readonly label: string;
    readonly type?: "text" | "email" | "tel" | undefined;
    readonly isRequired?: boolean | undefined;
    readonly defaultValue?: string | undefined;
  }[];
}

/** One shipping option or payment method. */
interface CheckoutChoice {
  readonly id: string;
  readonly label: string;
  readonly description?: string | undefined;
  /** A shipping option's price; none for a payment method. */
  readonly price?: Amount | undefined;
}

/** What the buyer submitted: every field by id, and the chosen shipping option and payment method. */
interface CheckoutValues {
  readonly fields: Readonly<Record<string, string>>;
  readonly shipping: string;
  readonly payment: string;
}

/**
 * The checkout form and its summary.
 *
 * @example
 * <Checkout sections={sections} shippingOptions={shipping} paymentMethods={methods} lines={lines} totals={totals}
 *   labels={labels} onSubmit={placeOrder} />
 */
export interface CheckoutProps {
  readonly sections: readonly CheckoutSection[];
  readonly shippingOptions: readonly CheckoutChoice[];
  readonly paymentMethods: readonly CheckoutChoice[];
  /** The summary lines: name, quantity and line amount. */
  readonly lines: readonly {
    readonly id: string;
    readonly name: string;
    readonly quantity: number;
    readonly amount: Amount;
  }[];
  readonly totals: OrderTotalsProps["totals"];
  /** The selected shipping option (controlled), so the host can re-price the totals. */
  readonly shipping?: string | undefined;
  readonly onShippingChange?: ((optionId: string) => void) | undefined;
  readonly onSubmit: (values: CheckoutValues) => void;
  /** True while the order is placed: the button spins. */
  readonly isSubmitting?: boolean | undefined;
  readonly labels: {
    readonly shipping: string;
    readonly payment: string;
    readonly summary: string;
    readonly placeOrder: string;
  };
  readonly className?: string | undefined;
}
