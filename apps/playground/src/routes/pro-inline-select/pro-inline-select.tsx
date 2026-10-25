/**
 * Stackra file contract:
 * Purpose: the page of the InlineSelect route: `@stackra-pro/ui`'s InlineSelect, a dropdown that blends into the text
 *          around it, in a controlled sentence that reports the item chosen and a disabled one.
 * Boundary: presentation and local state only. Each select is named by `label`; the sentence around it is plain text.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { ListBox, type Key } from "@heroui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProInlineSelectRoute } from "#src/routes/pro-inline-select/pro-inline-select.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-inline-select.*` keys.
const STRINGS = {
  documentTitle: `${ProInlineSelectRoute.title} · Stackra Playground`,
  intro:
    "A dropdown that reads as part of a sentence: it shows only its value and a chevron, and a press opens the list of items.",
  controlled: "Controlled",
  showing: "Showing results from",
  period: "Period",
  chosen: (name: string) => `Period: ${name}.`,
  none: "none",
  disabled: "Disabled",
  sorted: "Sorted by",
  sort: "Sort order",
} as const;

const PERIODS = [
  { id: "week", name: "the last 7 days" },
  { id: "month", name: "the last 30 days" },
  { id: "year", name: "the last year" },
] as const;

/** The list box of a select: one item per option, each with the mark of the chosen one. */
function Items() {
  return (
    <ListBox>
      {PERIODS.map((item) => (
        <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
          {item.name}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  );
}

/** The trigger, popover and list box of a select. */
function Parts() {
  return (
    <>
      <UiPro.InlineSelect.Trigger>
        <UiPro.InlineSelect.Value />
        <UiPro.InlineSelect.Indicator />
      </UiPro.InlineSelect.Trigger>
      <UiPro.InlineSelect.Popover className="w-48">
        <Items />
      </UiPro.InlineSelect.Popover>
    </>
  );
}

/** The InlineSelect page. */
export function ProInlineSelect() {
  const [period, setPeriod] = useState<Key | null>("week");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProInlineSelectRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        {/* A div, not a p: the InlineSelect's root is React Aria's Select, a div, which a p cannot hold. */}
        <div className="flex flex-wrap items-center gap-1">
          <bdi>{STRINGS.showing}</bdi>
          <UiPro.InlineSelect
            label={STRINGS.period}
            value={period}
            onChange={(value) => setPeriod(value as Key | null)}
          >
            <Parts />
          </UiPro.InlineSelect>
        </div>
        <p role="status" className="text-sm">
          <bdi>
            {STRINGS.chosen(PERIODS.find((item) => item.id === period)?.name ?? STRINGS.none)}
          </bdi>
        </p>
      </section>
      <section aria-labelledby="disabled-heading" className="grid gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <div className="flex flex-wrap items-center gap-1">
          <bdi>{STRINGS.sorted}</bdi>
          <UiPro.InlineSelect label={STRINGS.sort} defaultValue="month" isDisabled>
            <Parts />
          </UiPro.InlineSelect>
        </div>
      </section>
    </article>
  );
}
