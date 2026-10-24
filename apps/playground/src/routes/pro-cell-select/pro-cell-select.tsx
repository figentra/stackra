/**
 * Stackra file contract:
 * Purpose: the page of the CellSelect route: `@stackra/ui-pro`'s CellSelect, a select styled as a settings cell, in a
 *          controlled cell that reports the item chosen, an uncontrolled one with a placeholder, and a disabled one.
 * Boundary: presentation and local state only. Each cell is named by `label`, the same text as its visible label, and
 *          its trigger by the visible label and value.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { ListBox, type Key } from "@heroui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useId, useState } from "react";

import { ProCellSelectRoute } from "#src/routes/pro-cell-select/pro-cell-select.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-cell-select.*` keys.
const STRINGS = {
  documentTitle: `${ProCellSelectRoute.title} · Stackra Playground`,
  intro:
    "A select styled as a settings cell: the label and the chosen value on one row, and a press opens the list of items.",
  controlled: "Controlled",
  theme: "Theme",
  chosen: (name: string) => `Theme: ${name}.`,
  none: "none",
  uncontrolled: "Uncontrolled with a placeholder",
  language: "Language",
  placeholder: "Choose a language",
  disabled: "Disabled",
  region: "Region",
} as const;

const THEMES = [
  { id: "default", name: "Default" },
  { id: "dark", name: "Dark" },
  { id: "system", name: "System" },
] as const;

const LANGUAGES = [
  { id: "en", name: "English" },
  { id: "ar", name: "Arabic" },
  { id: "fr", name: "French" },
] as const;

/** The list box of a cell: one item per option, each with the mark of the chosen one. */
function Items({ items }: { readonly items: readonly { id: string; name: string }[] }) {
  return (
    <ListBox>
      {items.map((item) => (
        <ListBox.Item key={item.id} id={item.id} textValue={item.name}>
          {item.name}
          <ListBox.ItemIndicator />
        </ListBox.Item>
      ))}
    </ListBox>
  );
}

/**
 * The trigger of a cell, named by what it shows in reading order, the label then the value. React Aria names a select
 * trigger value first ("Default Theme"), the reverse of the visible "Theme Default", so the trigger is labelled by its
 * own label and value.
 */
function Trigger({ label }: { readonly label: string }) {
  const id = useId();
  return (
    <UiPro.CellSelect.Trigger aria-labelledby={`${id}-label ${id}-value`}>
      <UiPro.CellSelect.Label id={`${id}-label`}>{label}</UiPro.CellSelect.Label>
      <UiPro.CellSelect.Value id={`${id}-value`} />
      <UiPro.CellSelect.Indicator />
    </UiPro.CellSelect.Trigger>
  );
}

/** The CellSelect page. */
export function ProCellSelect() {
  const [theme, setTheme] = useState<Key | null>("default");

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProCellSelectRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="controlled-heading" className="grid max-w-xs gap-3">
        <h2 id="controlled-heading" className="type-h2">
          {STRINGS.controlled}
        </h2>
        <UiPro.CellSelect
          label={STRINGS.theme}
          value={theme}
          onChange={(value) => setTheme(value as Key | null)}
        >
          <Trigger label={STRINGS.theme} />
          <UiPro.CellSelect.Popover>
            <Items items={THEMES} />
          </UiPro.CellSelect.Popover>
        </UiPro.CellSelect>
        <p role="status" className="px-1 text-sm">
          <bdi>
            {STRINGS.chosen(THEMES.find((item) => item.id === theme)?.name ?? STRINGS.none)}
          </bdi>
        </p>
      </section>
      <section aria-labelledby="uncontrolled-heading" className="grid max-w-xs gap-3">
        <h2 id="uncontrolled-heading" className="type-h2">
          {STRINGS.uncontrolled}
        </h2>
        <UiPro.CellSelect label={STRINGS.language} placeholder={STRINGS.placeholder}>
          <Trigger label={STRINGS.language} />
          <UiPro.CellSelect.Popover>
            <Items items={LANGUAGES} />
          </UiPro.CellSelect.Popover>
        </UiPro.CellSelect>
      </section>
      <section aria-labelledby="disabled-heading" className="grid max-w-xs gap-3">
        <h2 id="disabled-heading" className="type-h2">
          {STRINGS.disabled}
        </h2>
        <UiPro.CellSelect label={STRINGS.region} defaultValue="en" isDisabled>
          <Trigger label={STRINGS.region} />
          <UiPro.CellSelect.Popover>
            <Items items={LANGUAGES} />
          </UiPro.CellSelect.Popover>
        </UiPro.CellSelect>
      </section>
    </article>
  );
}
