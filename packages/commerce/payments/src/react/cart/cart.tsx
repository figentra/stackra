/**
 * Stackra file contract:
 * Purpose: `Cart`, the commerce kit's shopping cart block: line items with image, variant, quantity stepper and line
 *          amount, the evaluated totals and the checkout button.
 * Boundary: composition of @stackra/ui only; the host owns the cart state and the pricing (the totals arrive in props).
 *           Every word comes in `labels`.
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL).
 */
import {
  Button,
  Card,
  MoneyValue,
  QuantityStepper,
  Separator,
  Text,
  Thumbnail,
} from "@stackra/ui/react";
import type { ReactElement } from "react";

import type { CartProps } from "#react/cart/cart.props";
import { OrderTotals } from "#react/order-totals/order-totals";

/**
 * The cart as a card: lines, totals and checkout; an empty cart shows `labels.empty` and no button.
 *
 * @example
 * <Cart lines={lines} totals={totals} labels={labels} onQuantityChange={set} onRemove={remove} onCheckout={go} />
 */
export function Cart({
  lines,
  totals,
  onQuantityChange,
  onRemove,
  onCheckout,
  isCheckingOut = false,
  labels,
  className,
}: CartProps): ReactElement {
  return (
    <Card className={className ?? ""}>
      <Card.Header>
        <Card.Title level={2}>{labels.title}</Card.Title>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        {lines.length === 0 ? (
          <Text tone="muted">{labels.empty}</Text>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.id} className="flex items-center gap-3">
                  <Thumbnail src={line.image} alt="" size="md" fallback="package" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Text isTruncated>{line.name}</Text>
                    {line.detail && (
                      <Text tone="muted" type="small">
                        {line.detail}
                      </Text>
                    )}
                    <QuantityStepper
                      size="sm"
                      label={labels.quantity(line.name)}
                      value={line.quantity}
                      minValue={1}
                      maxValue={line.maxQuantity}
                      onChange={(quantity) => onQuantityChange(line.id, quantity)}
                      onRemove={() => onRemove(line.id)}
                      removeLabel={labels.remove}
                    />
                  </div>
                  <MoneyValue
                    amount={line.unitPrice.amount * line.quantity}
                    currency={line.unitPrice.currency}
                    className="font-medium"
                  />
                </li>
              ))}
            </ul>
            <Separator />
            <OrderTotals totals={totals} />
          </>
        )}
      </Card.Content>
      {lines.length > 0 && (
        <Card.Footer>
          <Button isFullWidth isLoading={isCheckingOut} onPress={onCheckout}>
            {labels.checkout}
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}
