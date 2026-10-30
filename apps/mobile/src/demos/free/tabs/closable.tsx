/**
 * Stackra file contract:
 * Purpose: the "closable" demo of the native Tabs: open views that close from their mark (or the screen reader's close
 *          action), and a button that opens a new draft view.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { Button, Tabs, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_DEMO_KEYS } from "#src/demos/free/tabs/tabs-demo-keys.constant";

/** The demo's keys. */
const K = TABS_DEMO_KEYS.demo_free.tabs.closable;

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
    if (id === selected) setSelected(next[Math.min(at, next.length - 1)]?.id ?? "");
  };
  const add = () => {
    const n = drafts + 1;
    setDrafts(n);
    setViews([...views, { id: `draft-${n}`, label: t(K.draft, { n }) }]);
    setSelected(`draft-${n}`);
  };
  return (
    <View className="gap-3">
      {views.length === 0 ? (
        <Text>{t(K.empty)}</Text>
      ) : (
        <Tabs
          label={t(K.label)}
          items={views.map((view) => ({ ...view, isClosable: true, content: view.label }))}
          selectedKeys={[selected]}
          onSelectionChange={([id]) => setSelected(id ?? "")}
          onClose={close}
        />
      )}
      <View className="flex-row">
        <Button variant="secondary" size="sm" startIcon="plus" onPress={add}>
          {t(K.add)}
        </Button>
      </View>
    </View>
  );
}
