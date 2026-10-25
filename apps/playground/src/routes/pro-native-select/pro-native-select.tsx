/**
 * Stackra file contract:
 * Purpose: the page of the NativeSelect route: `@stackra-pro/ui`'s NativeSelect, a styled browser select, in a
 *          controlled select that reports the item chosen, both variants, a select with option groups, and a disabled one.
 * Boundary: presentation and local state only. Each `select` is named by `label` on its trigger, the same text as the
 *          visible text above it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProNativeSelectRoute } from "#src/routes/pro-native-select/pro-native-select.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-native-select.*` keys.
const STRINGS = {
  documentTitle: `${ProNativeSelectRoute.title} · Stackra Playground`,
  intro:
    "A styled wrapper around the browser's own select: the picker, the keyboard and the mobile wheel are the platform's.",
  controlled: "Controlled",
  state: "State",
  statePlaceholder: "Select a state",
  chosen: (name: string) => `State: ${name}.`,
  none: "none",
  variants: "Variants",
  primary: "Primary status",
  secondary: "Secondary status",
  statusPlaceholder: "Select status",
  groups: "With groups",
  department: "Department",
  departmentPlaceholder: "Select department",
  disabled: "Disabled",
  priority: "Priority",
} as const;

const STATES = [
  { id: "california", name: "California" },
  { id: "texas", name: "Texas" },
  { id: "florida", name: "Florida" },
] as const;

const STATUSES = [
  { id: "todo", name: "Todo" },
  { id: "in-progress", name: "In progress" },
  { id: "done", name: "Done" },
] as const;

const DEPARTMENTS = [
  { group: "Engineering", items: ["Frontend", "Backend", "DevOps"] },
  { group: "Sales", items: ["Sales rep", "Account manager"] },
] as const;

/** The options of the status selects. */
function StatusOptions() {
  return (
    <>
      <UiPro.NativeSelect.Option value="">{STRINGS.statusPlaceholder}</UiPro.NativeSelect.Option>
      {STATUSES.map((status) => (
        <UiPro.NativeSelect.Option key={status.id} value={status.id}>
          {status.name}
        </UiPro.NativeSelect.Option>
      ))}
    </>
  );
}

/** The NativeSelect page. */
export function ProNativeSelect() {
  const [state, setState] = useState("california");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProNativeSelectRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-xs gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <UiPro.NativeSelect isFullWidth>
          <UiPro.NativeSelect.Trigger
            label={STRINGS.state}
            name="state"
            value={state}
            onChange={(event) => setState(event.target.value)}
          >
            <UiPro.NativeSelect.Option value="">
              {STRINGS.statePlaceholder}
            </UiPro.NativeSelect.Option>
            {STATES.map((item) => (
              <UiPro.NativeSelect.Option key={item.id} value={item.id}>
                {item.name}
              </UiPro.NativeSelect.Option>
            ))}
            <UiPro.NativeSelect.Indicator />
          </UiPro.NativeSelect.Trigger>
        </UiPro.NativeSelect>
        <p role="status" className="text-sm">
          <bdi>
            {STRINGS.chosen(STATES.find((item) => item.id === state)?.name ?? STRINGS.none)}
          </bdi>
        </p>
      </section>
      <section aria-labelledby="variants-heading" className="grid max-w-xs gap-3">
        <h2 id="variants-heading" className="type-h2">
          {STRINGS.variants}
        </h2>
        <UiPro.NativeSelect isFullWidth variant="primary">
          <UiPro.NativeSelect.Trigger label={STRINGS.primary}>
            <StatusOptions />
            <UiPro.NativeSelect.Indicator />
          </UiPro.NativeSelect.Trigger>
        </UiPro.NativeSelect>
        <UiPro.NativeSelect isFullWidth variant="secondary">
          <UiPro.NativeSelect.Trigger label={STRINGS.secondary}>
            <StatusOptions />
            <UiPro.NativeSelect.Indicator />
          </UiPro.NativeSelect.Trigger>
        </UiPro.NativeSelect>
      </section>
      <section aria-labelledby="groups-heading" className="grid max-w-xs gap-3">
        <h2 id="groups-heading" className="type-h2">
          {STRINGS.groups}
        </h2>
        <UiPro.NativeSelect isFullWidth>
          <UiPro.NativeSelect.Trigger label={STRINGS.department}>
            <UiPro.NativeSelect.Option value="">
              {STRINGS.departmentPlaceholder}
            </UiPro.NativeSelect.Option>
            {DEPARTMENTS.map((department) => (
              <UiPro.NativeSelect.OptGroup key={department.group} label={department.group}>
                {department.items.map((item) => (
                  <UiPro.NativeSelect.Option key={item} value={item}>
                    {item}
                  </UiPro.NativeSelect.Option>
                ))}
              </UiPro.NativeSelect.OptGroup>
            ))}
            <UiPro.NativeSelect.Indicator />
          </UiPro.NativeSelect.Trigger>
        </UiPro.NativeSelect>
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-xs gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <UiPro.NativeSelect isFullWidth>
          <UiPro.NativeSelect.Trigger label={STRINGS.priority} isDisabled defaultValue="done">
            <StatusOptions />
            <UiPro.NativeSelect.Indicator />
          </UiPro.NativeSelect.Trigger>
        </UiPro.NativeSelect>
      </section>
    </article>
  );
}
