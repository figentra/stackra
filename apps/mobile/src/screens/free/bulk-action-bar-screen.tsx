/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `BulkActionBar` (@stackra/ui): the bar over a selection, with
 *          its first two actions in the bar and the rest in a sheet, "select all matching", an action that takes a
 *          moment, one that fails and one that is refused with its reason, and a live bar whose selection is set by
 *          buttons and whose count and actions are read out.
 * Boundary: presentation and local demo state only; the bar is @stackra/ui's, nothing here is styled by hand. The bar
 *          draws nothing while nothing is selected, so each sample starts with a selection; a failing action rejects
 *          on purpose, to show that the selection is left as it was. The actions' timers only resolve a promise, so
 *          nothing runs against the page after it is gone.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { ResourceAction } from "@stackra/ui/contracts";
import { BulkActionBar, Button, Text } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";
import { Icons } from "#src/constants/icons.constant";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description:
      "The count, the first two actions as buttons and a button that clears the selection.",
    label: "Invoice actions",
  },
  overflow: {
    title: "More actions",
    description:
      "Every action after the second goes in a sheet that a “more” button opens; a sheet's action closes it first.",
    label: "Invoice actions with a sheet",
    more: "More invoice actions",
  },
  matching: {
    title: "Select all matching",
    description:
      "When every row on screen is selected and the server counts more, the bar offers all of them; choosing it makes the total the count.",
    label: "Invoice actions, all matching",
  },
  states: {
    title: "A slow, a failing and a refused action",
    description:
      "Archive takes a moment and shows itself working, Delete fails and leaves the selection, and Export is refused with its reason in its accessible name.",
    label: "Invoice actions, with states",
    last: (text: string | null) => `Last action: ${text ?? "none"}`,
  },
  live: {
    title: "Try it",
    description:
      "Choose a selection: the bar appears with its count, which it announces. Archive clears the selection.",
    label: "Invoice actions, live",
    selectThree: "Select 3 invoices",
    selectPage: "Select all 20 on the page",
    count: (count: number) => `Selected: ${count}`,
    allMatching: (isAll: boolean) => `All matching: ${isAll ? "yes" : "no"}`,
  },
  actions: {
    send: "Send",
    archive: "Archive",
    download: "Download",
    delete: "Delete",
    export: "Export",
    exportReason: "Exporting is off for this workspace.",
    failure: "The invoice service did not answer.",
    done: (name: string) => `${name} done`,
    failed: (name: string) => `${name} failed`,
  },
} as const;

/** The total the pretend server counts, and how many rows a page shows. */
const TOTAL = 245;
const PAGE = 20;

/** How long a pretend action takes, so a busy state can be seen. */
const DELAY = 700;

/** Does nothing: an action that only has to be there. */
const ignore = () => undefined;

/** Waits for `ms` milliseconds. */
const delay = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** Four actions that do nothing: two fill the bar and two go in the sheet. */
const QUIET_ACTIONS: readonly ResourceAction[] = [
  { id: "send", label: STRINGS.actions.send, icon: Icons.SendHorizontal, onPress: ignore },
  { id: "archive", label: STRINGS.actions.archive, icon: Icons.Archive, onPress: ignore },
  { id: "download", label: STRINGS.actions.download, icon: Icons.Download, onPress: ignore },
  {
    id: "delete",
    label: STRINGS.actions.delete,
    icon: Icons.Trash,
    tone: "danger",
    onPress: ignore,
  },
];

/** The actions of the states sample: one slow, one that fails, one refused. */
function stateActionsOf(report: (text: string) => void): readonly ResourceAction[] {
  return [
    {
      id: "archive",
      label: STRINGS.actions.archive,
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.actions.done(STRINGS.actions.archive));
      },
    },
    {
      id: "delete",
      label: STRINGS.actions.delete,
      tone: "danger",
      onPress: async () => {
        await delay(DELAY);
        report(STRINGS.actions.failed(STRINGS.actions.delete));
        throw new Error(STRINGS.actions.failure);
      },
    },
    {
      id: "export",
      label: STRINGS.actions.export,
      isDisabled: true,
      disabledReason: STRINGS.actions.exportReason,
    },
  ];
}

/** The bar over a page of selected rows, offering to select every matching one. */
function MatchingSample() {
  const [isAll, setIsAll] = useState(false);
  return (
    <BulkActionBar
      label={STRINGS.matching.label}
      selectedCount={PAGE}
      isPageSelected
      totalCount={TOTAL}
      isAllMatchingSelected={isAll}
      onAllMatchingSelectedChange={setIsAll}
      actions={QUIET_ACTIONS.slice(0, 2)}
      onClearSelection={() => setIsAll(false)}
    />
  );
}

/** The bar with a slow, a failing and a refused action, the last one named under it. */
function StatesSample() {
  const [last, setLast] = useState<string | null>(null);
  return (
    <>
      <BulkActionBar
        label={STRINGS.states.label}
        selectedCount={3}
        actions={stateActionsOf(setLast)}
        onClearSelection={ignore}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.states.last(last)}
      </Text>
    </>
  );
}

/** A bar whose selection the page sets, so it can appear, change its count and go away. */
function LiveSample() {
  const [count, setCount] = useState(0);
  const [isAll, setIsAll] = useState(false);
  const clear = () => {
    setCount(0);
    setIsAll(false);
  };
  const actions: readonly ResourceAction[] = [
    {
      id: "archive",
      label: STRINGS.actions.archive,
      icon: Icons.Archive,
      onPress: async () => {
        await delay(DELAY);
        clear();
      },
    },
    { id: "download", label: STRINGS.actions.download, icon: Icons.Download, onPress: ignore },
  ];
  return (
    <>
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => setCount(3)}>
          {STRINGS.live.selectThree}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setCount(PAGE)}>
          {STRINGS.live.selectPage}
        </Button>
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {STRINGS.live.count(isAll ? TOTAL : count)}
      </Text>
      <Text tone="muted">{STRINGS.live.allMatching(isAll)}</Text>
      <BulkActionBar
        label={STRINGS.live.label}
        selectedCount={count}
        isPageSelected={count === PAGE}
        totalCount={TOTAL}
        isAllMatchingSelected={isAll}
        onAllMatchingSelectedChange={setIsAll}
        actions={actions}
        onClearSelection={clear}
      />
    </>
  );
}

/** The BulkActionBar page: one section per option, in a scrollable screen. */
export function BulkActionBarScreen() {
  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <BulkActionBar
          label={STRINGS.basics.label}
          selectedCount={3}
          actions={QUIET_ACTIONS.slice(0, 2)}
          onClearSelection={ignore}
        />
      </Section>

      <Section title={STRINGS.overflow.title} description={STRINGS.overflow.description}>
        <BulkActionBar
          label={STRINGS.overflow.label}
          moreActionsLabel={STRINGS.overflow.more}
          selectedCount={5}
          actions={QUIET_ACTIONS}
          onClearSelection={ignore}
        />
      </Section>

      <Section title={STRINGS.matching.title} description={STRINGS.matching.description}>
        <MatchingSample />
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        <StatesSample />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <LiveSample />
      </Section>
    </Screen>
  );
}
