/**
 * Stackra file contract:
 * Purpose: the page of the CheckboxButtonGroup route: `@stackra/ui-pro`'s CheckboxButtonGroup, a multi-selection group
 *          of card-style checkboxes, in a controlled group that reports what is chosen, a grid layout and a disabled group.
 * Boundary: presentation and local state only. Each group is named by `label`, the same text as its visible label; each
 *          card is named by its own label and described by its description.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { ProCheckboxButtonGroupRoute } from "#src/routes/pro-checkbox-button-group/pro-checkbox-button-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-checkbox-button-group.*` keys.
const STRINGS = {
  documentTitle: `${ProCheckboxButtonGroupRoute.title} · Stackra Playground`,
  intro:
    "A multi-selection group of cards: each card is a checkbox with a title and a description, and any number can be chosen.",
  controlled: "Controlled",
  addons: "Add-ons",
  addonsHint: "Select the add-ons you need",
  chosen: (values: readonly string[]) =>
    `Chosen: ${values.length > 0 ? values.join(", ") : "none"}.`,
  grid: "Grid layout",
  features: "Features",
  disabled: "Disabled",
  disabledFeatures: "Locked features",
  disabledHint: "Feature selection is unavailable.",
} as const;

const ADDONS = [
  { value: "backups", title: "Backups", description: "Automated daily backups" },
  { value: "monitoring", title: "Monitoring", description: "24/7 monitoring and alerts" },
  { value: "support", title: "Support", description: "Priority email and chat support" },
] as const;

const FEATURES = [
  { value: "security", title: "Security", description: "Real-time threat detection" },
  { value: "storage", title: "Storage", description: "Cloud storage with backups" },
  { value: "analytics", title: "Analytics", description: "Usage reports and dashboards" },
] as const;

/** One card per option, each with its indicator, title and description. */
function Items({
  items,
}: {
  readonly items: readonly { value: string; title: string; description: string }[];
}) {
  return items.map((item) => (
    <UiPro.CheckboxButtonGroup.Item key={item.value} value={item.value}>
      <UiPro.CheckboxButtonGroup.Indicator />
      <UiPro.CheckboxButtonGroup.ItemContent>
        <Ui.Label>{item.title}</Ui.Label>
        <Ui.Description>{item.description}</Ui.Description>
      </UiPro.CheckboxButtonGroup.ItemContent>
    </UiPro.CheckboxButtonGroup.Item>
  ));
}

/** The CheckboxButtonGroup page. */
export function ProCheckboxButtonGroup() {
  const [chosen, setChosen] = useState<string[]>(["backups"]);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCheckboxButtonGroupRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-sm gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <UiPro.CheckboxButtonGroup
          label={STRINGS.addons}
          name="addons"
          variant="secondary"
          value={chosen}
          onChange={setChosen}
        >
          <Ui.Label>{STRINGS.addons}</Ui.Label>
          <Ui.Description>{STRINGS.addonsHint}</Ui.Description>
          <Items items={ADDONS} />
        </UiPro.CheckboxButtonGroup>
        <p role="status" className="text-sm">
          <bdi>{STRINGS.chosen(chosen)}</bdi>
        </p>
      </section>
      <section aria-labelledby="grid-heading" className="grid gap-3">
        <h2 id="grid-heading" className="type-h2">
          {STRINGS.grid}
        </h2>
        <UiPro.CheckboxButtonGroup
          label={STRINGS.features}
          className="max-w-2xl grid-cols-1 sm:grid-cols-3"
          defaultValue={["security", "storage"]}
          layout="grid"
          name="features"
          variant="secondary"
        >
          <Ui.Label className="col-span-full">{STRINGS.features}</Ui.Label>
          <Items items={FEATURES} />
        </UiPro.CheckboxButtonGroup>
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-sm gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <UiPro.CheckboxButtonGroup
          label={STRINGS.disabledFeatures}
          defaultValue={["security"]}
          isDisabled
          name="locked-features"
          variant="secondary"
        >
          <Ui.Label>{STRINGS.disabledFeatures}</Ui.Label>
          <Ui.Description>{STRINGS.disabledHint}</Ui.Description>
          <Items items={FEATURES} />
        </UiPro.CheckboxButtonGroup>
      </section>
    </article>
  );
}
