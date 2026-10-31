/**
 * Stackra file contract:
 * Purpose: `Checkout`, the commerce kit's one-page checkout block: the host's form sections, a shipping option, a
 *          payment method and the order summary beside them, with the place-order button.
 * Boundary: composition of @stackra/ui only, in a native form: the browser checks required fields before `onSubmit`.
 *           No payment is taken here; the host passes the values to its payments gateway (`@stackra/payments`).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0165 (UI through @stackra/ui); ADR 0060 (light, dark, RTL).
 */
import { Button, Card, Heading, MoneyValue, RadioGroup, Text, TextField } from "@stackra/ui/react";
import { type FormEvent, type ReactElement, useState } from "react";

import type { CheckoutProps } from "#react/checkout/checkout.props";
import { OrderTotals } from "#react/order-totals/order-totals";

/** A choice's label with its price at the end, when it has one. */
function choiceLabel(choice: CheckoutProps["shippingOptions"][number]): ReactElement {
  return (
    <span className="flex w-full items-baseline justify-between gap-4">
      <span>{choice.label}</span>
      {choice.price && <MoneyValue amount={choice.price.amount} currency={choice.price.currency} />}
    </span>
  );
}

/**
 * The checkout: sections of fields, shipping and payment choices, and the summary.
 *
 * @example
 * <Checkout sections={sections} shippingOptions={shipping} paymentMethods={methods} lines={lines} totals={totals}
 *   labels={labels} onSubmit={placeOrder} />
 */
export function Checkout({
  sections,
  shippingOptions,
  paymentMethods,
  lines,
  totals,
  shipping,
  onShippingChange,
  onSubmit,
  isSubmitting = false,
  labels,
  className,
}: CheckoutProps): ReactElement {
  const [ownShipping, setOwnShipping] = useState(shippingOptions[0]?.id ?? "");
  const [payment, setPayment] = useState(paymentMethods[0]?.id ?? "");
  const chosenShipping = shipping ?? ownShipping;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = Object.fromEntries(
      sections.flatMap((section) =>
        section.fields.map((field) => [field.id, String(data.get(field.id) ?? "")]),
      ),
    );
    onSubmit({ fields, shipping: chosenShipping, payment });
  };
  return (
    // a container query, so the summary sits beside the form by the block's own width, not the screen's
    <div className={`@container w-full ${className ?? ""}`}>
      <form onSubmit={submit} className="grid gap-6 @3xl:grid-cols-3">
        <div className="flex flex-col gap-6 @3xl:col-span-2">
          {sections.map((section) => (
            <fieldset key={section.id} className="flex flex-col gap-3">
              <legend className="mb-3">
                <Heading level={3} type="h5">
                  {section.title}
                </Heading>
              </legend>
              {section.fields.map((field) => (
                <TextField
                  key={field.id}
                  name={field.id}
                  label={field.label}
                  type={field.type ?? "text"}
                  isRequired={field.isRequired}
                  defaultValue={field.defaultValue}
                  isFullWidth
                />
              ))}
            </fieldset>
          ))}
          <RadioGroup
            label={labels.shipping}
            value={chosenShipping}
            onChange={(next) => {
              setOwnShipping(next);
              onShippingChange?.(next);
            }}
            options={shippingOptions.map((choice) => ({
              value: choice.id,
              label: choiceLabel(choice),
              description: choice.description,
            }))}
          />
          <RadioGroup
            label={labels.payment}
            value={payment}
            onChange={setPayment}
            options={paymentMethods.map((choice) => ({
              value: choice.id,
              label: choiceLabel(choice),
              description: choice.description,
            }))}
          />
        </div>
        <Card variant="secondary" className="h-fit">
          <Card.Header>
            <Card.Title level={3}>{labels.summary}</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {lines.map((line) => (
                <li key={line.id} className="flex items-baseline justify-between gap-4">
                  <Text type="small">
                    {line.name} <bdi className="tabular-nums">× {line.quantity}</bdi>
                  </Text>
                  <MoneyValue
                    amount={line.amount.amount}
                    currency={line.amount.currency}
                    className="text-sm"
                  />
                </li>
              ))}
            </ul>
            <OrderTotals totals={totals} />
          </Card.Content>
          <Card.Footer>
            <Button type="submit" isFullWidth isLoading={isSubmitting}>
              {labels.placeOrder}
            </Button>
          </Card.Footer>
        </Card>
      </form>
    </div>
  );
}
