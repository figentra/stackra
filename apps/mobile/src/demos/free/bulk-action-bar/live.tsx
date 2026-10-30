/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native BulkActionBar: choose a selection and the bar appears with its announced count.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import { BulkActionBar, Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { BULK_ACTION_BAR_DEMO_KEYS } from "#src/demos/free/bulk-action-bar/bulk-action-bar-demo-keys.constant";

/** The demo's keys. */
const A = BULK_ACTION_BAR_DEMO_KEYS.demo_free.bulk_action_bar.actions;
const K = BULK_ACTION_BAR_DEMO_KEYS.demo_free.bulk_action_bar.live;

/** The total the pretend server counts, and how many rows a page shows. */
const TOTAL = 245;
const PAGE = 20;

/** How long Archive takes, so the busy state can be seen. */
const DELAY = 700;

/** A selection the buttons set; Archive clears it. */
export default function Live() {
  const [count, setCount] = useState(0);
  const [isAll, setIsAll] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  const clear = () => {
    setCount(0);
    setIsAll(false);
  };
  const actions: readonly ResourceAction[] = [
    {
      id: "archive",
      label: t(A.archive),
      icon: Icons.Archive,
      onPress: async () => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, DELAY);
        });
        clear();
      },
    },
    { id: "download", label: t(A.download), icon: Icons.Download, onPress: () => undefined },
  ];
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => setCount(3)}>
          {t(K.select_three)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setCount(PAGE)}>
          {t(K.select_page, { count: PAGE })}
        </Button>
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.count, { count: isAll ? TOTAL : count })}
      </Text>
      <Text tone="muted">{t(isAll ? K.all_yes : K.all_no)}</Text>
      <BulkActionBar
        label={t(K.label)}
        selectedCount={count}
        isPageSelected={count === PAGE}
        totalCount={TOTAL}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
        actions={actions}
        onClearSelection={clear}
      />
    </View>
  );
}
