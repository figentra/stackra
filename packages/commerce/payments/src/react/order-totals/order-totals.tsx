/**
 * Stackra file contract:
 * Purpose: `OrderTotals`, the description list of an order's totals the Cart and Checkout blocks end with.
 * Boundary: a function component on @stackra/ui; internal to the kit (the barrel does not export it).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui).
 */
import { MoneyValue, Text } from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { OrderTotalsProps } from "#react/order-totals/order-totals.props";

/** The totals as label and amount rows; the total row is bold under a rule (a border: a <dl> holds only dt/dd groups). */
export function OrderTotals({ totals }: OrderTotalsProps): ReactElement {
  return (
    <dl className="flex flex-col gap-2">
      {totals.map((row) => (
        <div
          key={row.id}
          className={`flex items-baseline justify-between gap-4${row.isTotal ? " border-t border-separator pt-2" : ""}`}
        >
          <dt>
            <Text tone={row.isTotal ? "default" : "muted"} type={row.isTotal ? "body" : "small"}>
              {row.label}
            </Text>
          </dt>
          <dd className={row.isTotal ? "text-lg font-semibold" : "text-sm"}>
            <MoneyValue amount={row.amount.amount} currency={row.amount.currency} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
