/**
 * Stackra file contract:
 * Purpose: the web `Listbox` on HeroUI v3's ListBox: an always-visible list of options in a bordered box, one or
 *          several chosen with a checkmark each, optionally in titled sections, under a label.
 * Boundary: React Aria's listbox: arrow keys move, Space or Enter chooses, type-ahead jumps; the label names it. The
 *           value is always the list of chosen ids.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA APG listbox; WCAG 2.2 SC 1.3.1 and 4.1.2; STA-1371.
 */
import { Description, Header, Label, ListBox, cn } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";

import type { SelectItem } from "#contracts/types/select-item.type";
import type { ListboxProps } from "#react/listbox/listbox.props";

/** One option with its description and checkmark. */
function Option({ item }: { readonly item: SelectItem }) {
  return (
    <ListBox.Item id={item.id} textValue={item.label} isDisabled={item.isDisabled ?? false}>
      {item.description ? (
        // The option is named by all its text, label then description: a name of the label alone left the visible
        // description outside it (axe label-content-name-mismatch). HeroUI's description class keeps its look.
        <div className="flex flex-col">
          <span>{item.label}</span>
          <span className="description">{item.description}</span>
        </div>
      ) : (
        item.label
      )}
      <ListBox.ItemIndicator />
    </ListBox.Item>
  );
}

/** The default for an unset list prop: one stable empty array, not a new one each render. */
const NONE: readonly never[] = [];

/** An always-visible list of options. */
export function Listbox({
  items = NONE,
  sections,
  selectionMode = "single",
  label,
  ariaLabel,
  description,
  value,
  defaultValue,
  onChange,
  isDisabled,
  className,
}: ListboxProps): ReactElement {
  const id = useId();
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const chosen = value ?? own;
  const all = sections ? sections.flatMap((section) => section.items) : items;
  return (
    <div data-slot="listbox" className={cn("grid gap-1.5", className)}>
      {label ? <Label id={id}>{label}</Label> : null}
      <ListBox
        {...(label ? { "aria-labelledby": id } : { "aria-label": ariaLabel ?? "" })}
        selectionMode={selectionMode}
        selectedKeys={new Set(chosen)}
        {...(isDisabled ? { disabledKeys: all.map((item) => item.id) } : {})}
        onSelectionChange={(keys) => {
          const next = keys === "all" ? all.map((item) => item.id) : [...keys].map(String);
          if (value === undefined) setOwn(next);
          onChange?.(next);
        }}
        className="max-h-80 overflow-auto rounded-[var(--radius-container)] border border-separator p-1"
      >
        {sections
          ? sections.map((section) => (
              <ListBox.Section key={section.id} id={section.id}>
                <Header className="px-2 pt-2 pb-1 text-xs font-medium text-muted">
                  {section.title}
                </Header>
                {section.items.map((item) => (
                  <Option key={item.id} item={item} />
                ))}
              </ListBox.Section>
            ))
          : items.map((item) => <Option key={item.id} item={item} />)}
      </ListBox>
      {description ? <Description>{description}</Description> : null}
    </div>
  );
}
