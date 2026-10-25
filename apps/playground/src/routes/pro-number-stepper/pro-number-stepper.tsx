/**
 * Stackra file contract:
 * Purpose: the page of the NumberStepper route: `@stackra-pro/ui`'s NumberStepper, a numeric input with decrement and
 *          increment buttons and an animated value, in a controlled stepper that reports its value, three sizes, a
 *          currency format and a disabled stepper.
 * Boundary: presentation and local state only. Each stepper is named by `label`; its two buttons take their names from
 *          React Aria, which adds the stepper's name.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProNumberStepperRoute } from "#src/routes/pro-number-stepper/pro-number-stepper.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-number-stepper.*` keys.
const STRINGS = {
  documentTitle: `${ProNumberStepperRoute.title} · Stackra Playground`,
  intro:
    "A numeric input with a decrement and an increment button. The value is animated as it changes, stays within its bounds and moves by its step.",
  controlled: "Controlled",
  quantity: "Quantity",
  value: (value: number) => `Quantity: ${value}.`,
  sizes: "Sizes",
  small: "Quantity small",
  medium: "Quantity medium",
  large: "Quantity large",
  format: "Format",
  price: "Price",
  disabled: "Disabled",
  seats: "Seats",
} as const;

const SIZES = [
  { size: "sm", label: STRINGS.small },
  { size: "md", label: STRINGS.medium },
  { size: "lg", label: STRINGS.large },
] as const;

/** A stepper with its three parts, the one shape of every stepper on the page. */
function Stepper(props: UiPro.NumberStepperProps) {
  return (
    <UiPro.NumberStepper {...props}>
      <UiPro.NumberStepper.Group>
        <UiPro.NumberStepper.DecrementButton />
        <UiPro.NumberStepper.Value />
        <UiPro.NumberStepper.IncrementButton />
      </UiPro.NumberStepper.Group>
    </UiPro.NumberStepper>
  );
}

/** The NumberStepper page. */
export function ProNumberStepper() {
  const [quantity, setQuantity] = useState(5);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProNumberStepperRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <div>
          <Stepper
            label={STRINGS.quantity}
            minValue={0}
            maxValue={20}
            value={quantity}
            onChange={setQuantity}
          />
        </div>
        <p role="status" className="text-sm">
          <bdi>{STRINGS.value(quantity)}</bdi>
        </p>
      </section>
      <section aria-labelledby="sizes-heading" className="grid gap-3">
        <h2 id="sizes-heading" className="type-h2">
          {STRINGS.sizes}
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          {SIZES.map(({ size, label }) => (
            <Stepper
              key={size}
              label={label}
              size={size}
              defaultValue={1}
              minValue={0}
              maxValue={99}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="format-heading" className="grid gap-3">
        <h2 id="format-heading" className="type-h2">
          {STRINGS.format}
        </h2>
        <div>
          <Stepper
            label={STRINGS.price}
            defaultValue={10}
            minValue={0}
            maxValue={100}
            formatOptions={{ currency: "USD", style: "currency" }}
          />
        </div>
      </section>
      <section aria-labelledby="disabled-heading" className="grid gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <div>
          <Stepper label={STRINGS.seats} defaultValue={3} minValue={0} maxValue={10} isDisabled />
        </div>
      </section>
    </article>
  );
}
