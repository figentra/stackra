/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Tabs: a selection the demo holds and reports, moved by buttons too.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0313.
 */
import { Button, Tabs, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { tabsSections } from "#src/demos/free/tabs/tabs-sections.function";
import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demo's keys. */
const K = TABS_KEYS.tabs.live;

/** Controlled tabs. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [picked, setPicked] = useState<readonly string[]>(["overview"]);
  return (
    <div className="grid gap-4">
      <Tabs
        items={tabsSections(t)}
        label={t(K.label)}
        selectedKeys={picked}
        onSelectionChange={setPicked}
      />
      <Text role="status" data-testid="tabs-selected" tone="muted">
        {t(K.selected, { keys: picked.length === 0 ? t(K.none) : picked.join(", ") })}
      </Text>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onPress={() => setPicked(["history"])}>
          {t(K.show_history)}
        </Button>
        <Button variant="secondary" onPress={() => setPicked(["overview"])}>
          {t(K.show_overview)}
        </Button>
      </div>
    </div>
  );
}
