/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `toast()` and `ToastProvider` (@stackra/ui): a toast of each
 *          tone, a toast with a second line, one with an action, one with a custom icon, one that stays until it is
 *          dismissed, and a live toast whose close is reported.
 * Boundary: presentation and local demo state only; the toasts are @stackra/ui's, nothing here is styled by hand. The
 *          app root mounts no `ToastProvider`, so the page mounts one around its own screen; `toast()` is imperative
 *          and shows nothing without one.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import { Button, Text, ToastProvider, toast } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  dismiss: "Dismiss notification",
  tones: {
    title: "Tones",
    description:
      "`toast()` shows a plain message; `success`, `warning`, `danger` and `info` set the tone, its icon and how it is announced.",
    plain: "Plain",
    success: "Success",
    warning: "Warning",
    danger: "Danger",
    info: "Info",
    messages: {
      plain: "Your draft is ready.",
      success: "Your changes were saved.",
      warning: "Your storage is almost full.",
      danger: "The upload failed.",
      info: "A new version is available.",
    },
  },
  detail: {
    title: "Second line and icon",
    description: "`description` adds a second line, and `icon` replaces the tone's icon by name.",
    withDetail: "Add a second line",
    icon: "Use another icon",
    message: "Invoice sent",
    detail: "Ada Lovelace will get it within a minute.",
    reminder: "Reminder set",
  },
  action: {
    title: "With an action",
    description:
      "`action` is one button on the toast; pressing it runs the handler and closes the toast. A toast with an action stays longer.",
    show: "Delete the file",
    message: "File deleted",
    undo: "Undo",
    undone: "The deletion was undone.",
    waiting: "Nothing undone yet.",
  },
  duration: {
    title: "How long a toast stays",
    description:
      "`timeout` is in milliseconds. 0 keeps the toast until it is dismissed; `toast.clear()` closes every toast.",
    short: "Show for one second",
    persistent: "Show until dismissed",
    clear: "Clear all toasts",
    shortMessage: "Gone in a second.",
    persistentMessage: "I stay until you dismiss me.",
  },
  live: {
    title: "Try it",
    description: "Show a toast; the readout says when it closes, however it closed.",
    show: "Show a toast",
    message: "Saved to your drafts.",
    closed: (count: number) =>
      count === 0 ? "No toast closed yet." : `Toasts closed so far: ${count}.`,
  },
} as const;

/** The Toast page: one section per option, in a scrollable screen. */
export function ToastScreen() {
  const [isUndone, setIsUndone] = useState(false);
  const [closed, setClosed] = useState(0);

  return (
    <ToastProvider dismissLabel={STRINGS.dismiss}>
      <Screen>
        <Section title={STRINGS.tones.title} description={STRINGS.tones.description}>
          <View className="flex-row flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast(STRINGS.tones.messages.plain)}
            >
              {STRINGS.tones.plain}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast.success(STRINGS.tones.messages.success)}
            >
              {STRINGS.tones.success}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast.warning(STRINGS.tones.messages.warning)}
            >
              {STRINGS.tones.warning}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast.danger(STRINGS.tones.messages.danger)}
            >
              {STRINGS.tones.danger}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast.info(STRINGS.tones.messages.info)}
            >
              {STRINGS.tones.info}
            </Button>
          </View>
        </Section>

        <Section title={STRINGS.detail.title} description={STRINGS.detail.description}>
          <View className="flex-row flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() =>
                toast.success(STRINGS.detail.message, { description: STRINGS.detail.detail })
              }
            >
              {STRINGS.detail.withDetail}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast.info(STRINGS.detail.reminder, { icon: "bell" })}
            >
              {STRINGS.detail.icon}
            </Button>
          </View>
        </Section>

        <Section title={STRINGS.action.title} description={STRINGS.action.description}>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setIsUndone(false);
              toast(STRINGS.action.message, {
                action: { label: STRINGS.action.undo, onPress: () => setIsUndone(true) },
              });
            }}
          >
            {STRINGS.action.show}
          </Button>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {isUndone ? STRINGS.action.undone : STRINGS.action.waiting}
          </Text>
        </Section>

        <Section title={STRINGS.duration.title} description={STRINGS.duration.description}>
          <View className="flex-row flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast(STRINGS.duration.shortMessage, { timeout: 1000 })}
            >
              {STRINGS.duration.short}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => toast(STRINGS.duration.persistentMessage, { timeout: 0 })}
            >
              {STRINGS.duration.persistent}
            </Button>
            <Button size="sm" variant="tertiary" onPress={() => toast.clear()}>
              {STRINGS.duration.clear}
            </Button>
          </View>
        </Section>

        <Section title={STRINGS.live.title} description={STRINGS.live.description}>
          <Button
            size="sm"
            variant="secondary"
            onPress={() =>
              toast.success(STRINGS.live.message, {
                onClose: () => setClosed((count) => count + 1),
              })
            }
          >
            {STRINGS.live.show}
          </Button>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.live.closed(closed)}
          </Text>
        </Section>
      </Screen>
    </ToastProvider>
  );
}
