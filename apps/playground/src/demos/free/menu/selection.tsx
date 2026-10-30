/**
 * Stackra file contract:
 * Purpose: the "selection" demo of the web Menu: Selection is scoped to a group: single keeps one choice per group,
 *          multiple keeps any number. The chosen keys are one list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0312; ADR 0060 (light, dark, RTL).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu as UiMenu, Text, useCatalogueText } from "@stackra/ui/react";
import { useState, type ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_KEYS } from "#src/demos/free/menu/menu-keys.constant";

/** The demo's keys. */
const K = MENU_KEYS.menu;

/** A sample with its caption underneath. */
function Sample({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <li className="grid justify-items-start gap-2">
      {children}
      <Text type="small" tone="muted">
        <bdi>{caption}</bdi>
      </Text>
    </li>
  );
}

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Menu: Selection. */
export default function Selection() {
  const t = useCatalogueText(MESSAGES.en);
  /** Two groups with one choice each: the order and the field to sort by. */
  const SORT_SECTIONS: readonly MenuSection[] = [
    {
      id: "order",
      title: t(K.sample.order),
      items: [
        { id: "asc", label: t(K.sample.ascending) },
        { id: "desc", label: t(K.sample.descending) },
      ],
    },
    {
      id: "by",
      title: t(K.sample.sort_by),
      items: [
        { id: "name", label: t(K.sample.name) },
        { id: "date", label: t(K.sample.date) },
        { id: "total", label: t(K.sample.total) },
      ],
    },
  ];
  /** One group of columns, any of which can show. */
  const COLUMN_SECTIONS: readonly MenuSection[] = [
    {
      id: "columns",
      title: t(K.sample.columns),
      items: [
        { id: "id", label: t(K.sample.order_number) },
        { id: "customer", label: t(K.sample.customer) },
        { id: "total", label: t(K.sample.total) },
        { id: "status", label: t(K.sample.status) },
      ],
    },
  ];
  const [sort, setSort] = useState<readonly string[]>(["desc", "date"]);

  const [columns, setColumns] = useState<readonly string[]>(["id", "customer"]);

  return (
    <ul className={ROW}>
      <Sample caption={t(K.single_caption)}>
        <UiMenu sections={SORT_SECTIONS} selectionMode="single" value={sort} onChange={setSort}>
          <Button variant="secondary">{t(K.single_trigger)}</Button>
        </UiMenu>
        <Text role="status" data-testid="menu-single-chosen" tone="muted">
          {t(K.chosen, { keys: sort.join(", ") || "none" })}
        </Text>
      </Sample>
      <Sample caption={t(K.multiple_caption)}>
        <UiMenu
          sections={COLUMN_SECTIONS}
          selectionMode="multiple"
          value={columns}
          onChange={setColumns}
        >
          <Button variant="secondary">{t(K.multiple_trigger)}</Button>
        </UiMenu>
        <Text role="status" data-testid="menu-multiple-chosen" tone="muted">
          {t(K.chosen, { keys: columns.join(", ") || "none" })}
        </Text>
      </Sample>
    </ul>
  );
}
