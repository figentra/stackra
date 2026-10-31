/**
 * Stackra file contract:
 * Purpose: `PricingTableProps`, what a host hands the PricingTable block: the plans, the billing periods and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). Plans, prices, periods and copy are data
 *           the host reads from its catalogue or settings; the block hard-codes none of them (configuration, not code).
 * Runtime: browser
 * Governing contract: ADR 0503 (module UI kits); ADR 0305 (`<name>.props.ts`).
 */

/** One billing period: "monthly", "yearly" or any the host sells. */
interface PricingPeriod {
  readonly id: string;
  /** The switch label: "Monthly". */
  readonly label: string;
  /** Written after the price: "/ month". */
  readonly suffix: string;
}

/** One plan column. */
interface PricingPlan {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
  /** The price per period id; a period with no price hides the amount. */
  readonly prices: Readonly<Record<string, { readonly amount: number; readonly currency: string }>>;
  /** What the plan includes, one line each. */
  readonly features: readonly string[];
  /** The button label: "Start free trial". */
  readonly cta: string;
  /** A chip over the featured plan: "Most popular". */
  readonly badge?: string | undefined;
  /** Draws the plan raised, with a primary button. */
  readonly isFeatured?: boolean | undefined;
}

/**
 * The plans, the periods and the choice.
 *
 * @example
 * <PricingTable plans={plans} periods={periods} periodLabel="Billing period" onSelect={choose} />
 */
export interface PricingTableProps {
  readonly plans: readonly PricingPlan[];
  /** One period hides the switch. */
  readonly periods: readonly PricingPeriod[];
  /** The selected period (controlled). */
  readonly period?: string | undefined;
  /** The first selected period (uncontrolled); default the first period. */
  readonly defaultPeriod?: string | undefined;
  readonly onPeriodChange?: ((periodId: string) => void) | undefined;
  /** The accessible name of the period switch. */
  readonly periodLabel: string;
  /** A plan's button was pressed. */
  readonly onSelect: (planId: string, periodId: string) => void;
  readonly className?: string | undefined;
}
