/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native BulkActionBar: a slow action, a failing one and one refused with its reason.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import { BulkActionBar, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BULK_ACTION_BAR_DEMO_KEYS } from "#src/demos/free/bulk-action-bar/bulk-action-bar-demo-keys.constant";

/** The demo's keys. */
const A = BULK_ACTION_BAR_DEMO_KEYS.demo_free.bulk_action_bar.actions;
const K = BULK_ACTION_BAR_DEMO_KEYS.demo_free.bulk_action_bar.states;

/** How long a pretend action takes, so the busy state can be seen. */
const DELAY = 700;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Archive shows itself working, Delete fails and keeps the selection, Export is refused. */
export default function States() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const actions: readonly ResourceAction[] = [
    {
      id: "archive",
      label: t(A.archive),
      onPress: async () => {
        await delay(DELAY);
        setLast(t(K.done, { name: t(A.archive) }));
      },
    },
    {
      id: "delete",
      label: t(A.delete),
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        setLast(t(K.failed, { name: t(A.delete) }));
        throw new Error(t(K.failure));
      },
    },
    { id: "export", label: t(A.export), isDisabled: true, disabledReason: t(K.export_reason) },
  ];
  return (
    <View className="gap-3">
      <BulkActionBar
        label={t(K.label)}
        selectedCount={3}
        actions={actions}
        onClearSelection={() => undefined}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {last === null ? t(K.none) : t(K.last, { text: last })}
      </Text>
    </View>
  );
}
