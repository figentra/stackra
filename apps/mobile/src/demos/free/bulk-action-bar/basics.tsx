/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native BulkActionBar: the count, the first two actions and a clear button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import { BulkActionBar, useCatalogueText } from "@stackra/ui/native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { BULK_ACTION_BAR_DEMO_KEYS } from "#src/demos/free/bulk-action-bar/bulk-action-bar-demo-keys.constant";

/** The demo's keys. */
const A = BULK_ACTION_BAR_DEMO_KEYS.demo_free.bulk_action_bar.actions;
const K = BULK_ACTION_BAR_DEMO_KEYS.demo_free.bulk_action_bar.basics;

/** Three rows selected, two actions. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  // Actions that only have to be there: their handlers do nothing.
  const actions: readonly ResourceAction[] = [
    { id: "send", label: t(A.send), icon: Icons.SendHorizontal, onPress: () => undefined },
    { id: "archive", label: t(A.archive), icon: Icons.Archive, onPress: () => undefined },
    { id: "download", label: t(A.download), icon: Icons.Download, onPress: () => undefined },
    {
      id: "delete",
      label: t(A.delete),
      icon: Icons.Trash,
      tone: "danger",
      onPress: () => undefined,
    },
  ];
  return (
    <BulkActionBar
      label={t(K.label)}
      selectedCount={3}
      actions={actions.slice(0, 2)}
      onClearSelection={() => undefined}
    />
  );
}
