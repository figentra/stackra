/**
 * Stackra file contract:
 * Purpose: the page of the RadioButtonGroup route: `@stackra/ui-pro`'s RadioButtonGroup, a single-selection group of
 *          card-style radios, in a controlled group that reports the choice, a grid layout and a disabled group.
 * Boundary: presentation and local state only. Each group is named by `label`, the same text as its visible label; each
 *          card is named by its own label and described by its description.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProRadioButtonGroupRoute } from "#src/routes/pro-radio-button-group/pro-radio-button-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-radio-button-group.*` keys.
const STRINGS = {
  documentTitle: `${ProRadioButtonGroupRoute.title} · Stackra Playground`,
  intro:
    "A single-selection group of cards: each card is a radio with a title and a description, and one is chosen at a time.",
  controlled: "Controlled",
  plan: "Select a plan",
  planHint: "Choose the plan that suits your needs",
  chosen: (title: string) => `Plan: ${title}.`,
  grid: "Grid layout",
  delivery: "Delivery speed",
  disabled: "Disabled",
  disabledPlan: "Locked plan",
  disabledHint: "Plan selection is unavailable.",
} as const;

const PLANS = [
  { value: "starter", title: "Starter", description: "For individuals and small projects" },
  { value: "pro", title: "Pro", description: "For growing teams and businesses" },
  { value: "enterprise", title: "Enterprise", description: "For large organizations at scale" },
] as const;

const DELIVERY = [
  { value: "standard", title: "Standard", description: "4 to 10 business days" },
  { value: "express", title: "Express", description: "2 to 5 business days" },
  { value: "overnight", title: "Overnight", description: "1 business day" },
] as const;

/** One card per option, each with its indicator, title and description. */
function Items({
  items,
}: {
  readonly items: readonly { value: string; title: string; description: string }[];
}) {
  return items.map((item) => (
    <UiPro.RadioButtonGroup.Item key={item.value} value={item.value}>
      <UiPro.RadioButtonGroup.Indicator />
      <UiPro.RadioButtonGroup.ItemContent>
        <Ui.Label>{item.title}</Ui.Label>
        <Ui.Description>{item.description}</Ui.Description>
      </UiPro.RadioButtonGroup.ItemContent>
    </UiPro.RadioButtonGroup.Item>
  ));
}

/** The RadioButtonGroup page. */
export function ProRadioButtonGroup() {
  const [plan, setPlan] = useState("pro");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProRadioButtonGroupRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-sm gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <UiPro.RadioButtonGroup name="plan" variant="secondary" value={plan} onChange={setPlan}>
          <Ui.Label>{STRINGS.plan}</Ui.Label>
          <Ui.Description>{STRINGS.planHint}</Ui.Description>
          <Items items={PLANS} />
        </UiPro.RadioButtonGroup>
        <p role="status" className="text-sm">
          <bdi>{STRINGS.chosen(PLANS.find((item) => item.value === plan)?.title ?? plan)}</bdi>
        </p>
      </section>
      <section aria-labelledby="grid-heading" className="grid gap-3">
        <h2 id="grid-heading" className="type-h2">
          {STRINGS.grid}
        </h2>
        <UiPro.RadioButtonGroup
          className="max-w-2xl grid-cols-1 sm:grid-cols-3"
          defaultValue="express"
          layout="grid"
          name="delivery"
          variant="secondary"
        >
          <Ui.Label className="col-span-full">{STRINGS.delivery}</Ui.Label>
          <Items items={DELIVERY} />
        </UiPro.RadioButtonGroup>
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-sm gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <UiPro.RadioButtonGroup
          defaultValue="starter"
          isDisabled
          name="locked-plan"
          variant="secondary"
        >
          <Ui.Label>{STRINGS.disabledPlan}</Ui.Label>
          <Ui.Description>{STRINGS.disabledHint}</Ui.Description>
          <Items items={PLANS} />
        </UiPro.RadioButtonGroup>
      </section>
    </article>
  );
}
