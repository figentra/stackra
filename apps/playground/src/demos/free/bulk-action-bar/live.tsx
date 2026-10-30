/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Bulk action bar: Pick some orders. Archive takes a moment and shows itself
 *          busy, then clears the selection. Delete fails and leaves the selection as it was. Emptying the selection
 *          moves focus to the list.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0318 (decisions 4 to 6); ADR 0139; ADR 0060 (light, dark, RTL); WCAG 2.2 SC
 *          2.4.3, 4.1.3.
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import {
  BulkActionBar as UiBulkActionBar,
  CheckboxGroup,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { BULK_ACTION_BAR_KEYS } from "#src/demos/free/bulk-action-bar/bulk-action-bar-keys.constant";

/** The demo's keys. */
const K = BULK_ACTION_BAR_KEYS.bulk_action_bar;

/** How long a fake action takes, so the busy state can be seen and tested. */
const DELAY = 1000;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** The live example: a list of orders, a selection kept by the page and a bar with a slow and a failing action. */
function LiveExample() {
  const t = useCatalogueText(MESSAGES.en);
  /** The orders of the live example. */
  const ORDERS = [
    { value: "ord-1001", label: t(K.sample.order_1001) },
    { value: "ord-1002", label: t(K.sample.order_1002) },
    { value: "ord-1003", label: t(K.sample.order_1003) },
    { value: "ord-1004", label: t(K.sample.order_1004) },
    { value: "ord-1005", label: t(K.sample.order_1005) },
  ] as const;
  const [selected, setSelected] = useState<readonly string[]>(["ord-1002", "ord-1003"]);
  const [last, setLast] = useState<string>(t(K.none));
  // Focus lands here when the bar goes, so a keyboard user is not dropped at the top of the page (WCAG 2.4.3).
  const region = useRef<HTMLDivElement>(null);
  const previousCount = useRef(selected.length);
  useEffect(() => {
    // The bar unmounts when the selection empties; if it held focus (the clear button, or an action that cleared the
    // selection), the browser drops it on the body, so it moves to the example instead.
    if (
      previousCount.current > 0 &&
      selected.length === 0 &&
      document.activeElement === document.body
    )
      region.current?.focus({ preventScroll: true });
    previousCount.current = selected.length;
  }, [selected.length]);

  const actions: readonly ResourceAction[] = [
    {
      id: "archive",
      label: t(K.archive),
      onPress: async () => {
        setLast(t(K.working));
        await delay(DELAY);
        setLast(t(K.done, { name: t(K.archive) }));
        setSelected([]);
      },
    },
    {
      id: "delete",
      label: t(K.delete),
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        setLast(t(K.failed, { name: t(K.delete) }));
        throw new Error(t(K.failure));
      },
    },
  ];

  return (
    <div
      ref={region}
      tabIndex={-1}
      data-testid="bulk-action-bar-live"
      className="grid gap-3 outline-none"
    >
      <CheckboxGroup
        label={t(K.live_list)}
        options={ORDERS}
        value={selected}
        onChange={setSelected}
      />
      <UiBulkActionBar
        label={t(K.live_label)}
        selectedCount={selected.length}
        actions={actions}
        onClearSelection={() => setSelected([])}
      />
      <Text role="status" data-testid="bulk-action-bar-selected" tone="muted">
        {t(K.selected, { keys: selected.join(", ") || "none" })}
      </Text>
      <Text role="status" data-testid="bulk-action-bar-last" tone="muted">
        {t(K.last_action, { text: last })}
      </Text>
    </div>
  );
}

/** Bulk action bar: Try it. */
export default function Live() {
  return <LiveExample />;
}
