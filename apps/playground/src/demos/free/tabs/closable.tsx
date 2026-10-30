/**
 * Stackra file contract:
 * Purpose: the "closable" demo of the web Tabs: open views of a back office that close from their mark or with Delete,
 *          and a button that opens a new draft view.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave C).
 */
import { Button, Tabs, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demo's keys. */
const K = TABS_KEYS.tabs.closable;

/** Tabs: views that close. */
export default function Closable() {
  const t = useCatalogueText(MESSAGES.en);
  const [views, setViews] = useState([
    { id: "orders", label: t(K.orders) },
    { id: "returns", label: t(K.returns) },
    { id: "customers", label: t(K.customers) },
  ]);
  const [selected, setSelected] = useState("orders");
  const [drafts, setDrafts] = useState(0);
  const close = (id: string) => {
    const at = views.findIndex((view) => view.id === id);
    const next = views.filter((view) => view.id !== id);
    setViews(next);
    // Closing the open view opens its neighbour, as a browser does.
    if (id === selected) setSelected(next[Math.min(at, next.length - 1)]?.id ?? "");
  };
  const add = () => {
    const n = drafts + 1;
    const id = `draft-${n}`;
    setDrafts(n);
    setViews([...views, { id, label: t(K.draft, { n }) }]);
    setSelected(id);
  };
  return (
    <div className="grid w-full max-w-xl gap-3">
      {views.length === 0 ? (
        <p className="m-0 text-sm text-muted">{t(K.empty)}</p>
      ) : (
        <Tabs
          label={t(K.label)}
          items={views.map((view) => ({
            ...view,
            isClosable: true,
            content: <p className="m-0 py-3 text-sm text-muted">{view.label}</p>,
          }))}
          selectedKeys={[selected]}
          onSelectionChange={([id]) => setSelected(id ?? "")}
          onClose={close}
        />
      )}
      <div>
        <Button variant="secondary" size="sm" startIcon="plus" onPress={add}>
          {t(K.add)}
        </Button>
      </div>
    </div>
  );
}
