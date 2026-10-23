/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SwipeableRow` (@stackra/ui-pro): standalone rows with
 *          start and end actions in different `tone`s, an inline list, a row opened from a button through its ref,
 *          and the disabled state.
 * Boundary: presentation and local demo state only; the row is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0304 (decision 6); STA-403 FR-010.
 */
import { SwipeableRow } from "@stackra/ui-pro/native";
import { Button, Separator, Typography } from "heroui-native";
import type { SwipeableRowRootRef } from "heroui-native-pro/swipeable-row";
import { Fragment, useRef, useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  standalone: {
    title: "Start and end actions",
    description:
      "Swipe towards the end to reveal Mute and Delete, towards the start for Mark read. In a right-to-left language the rails swap sides.",
    rowName: "Message from Layla Hassan",
    sender: "Layla Hassan",
    preview: "The shipment cleared customs this morning.",
    markRead: "Mark read",
    mute: "Mute",
    delete: "Delete",
    last: "Last action:",
    none: "none yet",
  },
  inline: {
    title: "Inline list",
    description: "The `inline` variant is a square, flat row for lists whose rows touch.",
    items: [
      { id: "1", sender: "Omar Farouk", preview: "Invoice 2041 is ready for review." },
      { id: "2", sender: "Nadia Saleh", preview: "Can we move the call to Thursday?" },
      { id: "3", sender: "Youssef Amin", preview: "Stock count for the Cairo store." },
    ],
    archive: "Archive",
    delete: "Delete",
  },
  controlled: {
    title: "Opened from code",
    description: "The row's ref opens and closes a rail: `open('end')`, `close()`.",
    rowName: "Message from Hana Mostafa",
    sender: "Hana Mostafa",
    preview: "Please confirm the delivery window.",
    archive: "Archive",
    open: "Show actions",
    close: "Hide actions",
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` refuses the swipe and the action presses.",
    rowName: "Message from Karim Adel, swiping disabled",
    sender: "Karim Adel",
    preview: "This row cannot be swiped.",
    delete: "Delete",
  },
} as const;

/** The content of one message row: the sender in bold, the preview muted beneath. */
function MessageRow({ sender, preview }: { sender: string; preview: string }) {
  return (
    <View className="gap-1 p-4">
      <Typography.Paragraph weight="semibold">{sender}</Typography.Paragraph>
      <Typography.Paragraph type="body-sm" color="muted">
        {preview}
      </Typography.Paragraph>
    </View>
  );
}

/** The SwipeableRow page: one section per layout and state, in a scrollable screen. */
export function SwipeableRowScreen() {
  const [lastAction, setLastAction] = useState<string>(STRINGS.standalone.none);
  const [isOpen, setIsOpen] = useState(false);
  const rowRef = useRef<SwipeableRowRootRef>(null);

  return (
    <Screen>
      <Section title={STRINGS.standalone.title} description={STRINGS.standalone.description}>
        <SwipeableRow label={STRINGS.standalone.rowName}>
          <SwipeableRow.Actions side="start">
            <SwipeableRow.Action
              tone="success"
              onPress={() => setLastAction(STRINGS.standalone.markRead)}
            >
              {STRINGS.standalone.markRead}
            </SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action onPress={() => setLastAction(STRINGS.standalone.mute)}>
              {STRINGS.standalone.mute}
            </SwipeableRow.Action>
            <SwipeableRow.Action
              tone="danger"
              onPress={() => setLastAction(STRINGS.standalone.delete)}
            >
              {STRINGS.standalone.delete}
            </SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow sender={STRINGS.standalone.sender} preview={STRINGS.standalone.preview} />
          </SwipeableRow.Content>
        </SwipeableRow>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.standalone.last} ${lastAction}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.inline.title} description={STRINGS.inline.description}>
        <View className="overflow-hidden rounded-3xl">
          {STRINGS.inline.items.map(({ id, sender, preview }, index) => (
            <Fragment key={id}>
              {index > 0 ? <Separator /> : null}
              <SwipeableRow variant="inline" label={sender}>
                <SwipeableRow.Actions side="start">
                  <SwipeableRow.Action tone="accent">{STRINGS.inline.archive}</SwipeableRow.Action>
                </SwipeableRow.Actions>
                <SwipeableRow.Actions side="end">
                  <SwipeableRow.Action tone="danger">{STRINGS.inline.delete}</SwipeableRow.Action>
                </SwipeableRow.Actions>
                <SwipeableRow.Content>
                  <MessageRow sender={sender} preview={preview} />
                </SwipeableRow.Content>
              </SwipeableRow>
            </Fragment>
          ))}
        </View>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <SwipeableRow
          ref={rowRef}
          label={STRINGS.controlled.rowName}
          onOpenSideChange={(side) => setIsOpen(side !== null)}
        >
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action tone="accent">{STRINGS.controlled.archive}</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow sender={STRINGS.controlled.sender} preview={STRINGS.controlled.preview} />
          </SwipeableRow.Content>
        </SwipeableRow>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => (isOpen ? rowRef.current?.close() : rowRef.current?.open("end"))}
        >
          {isOpen ? STRINGS.controlled.close : STRINGS.controlled.open}
        </Button>
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <SwipeableRow label={STRINGS.disabled.rowName} isDisabled>
          <SwipeableRow.Actions side="end">
            <SwipeableRow.Action tone="danger">{STRINGS.disabled.delete}</SwipeableRow.Action>
          </SwipeableRow.Actions>
          <SwipeableRow.Content>
            <MessageRow sender={STRINGS.disabled.sender} preview={STRINGS.disabled.preview} />
          </SwipeableRow.Content>
        </SwipeableRow>
      </Section>
    </Screen>
  );
}
