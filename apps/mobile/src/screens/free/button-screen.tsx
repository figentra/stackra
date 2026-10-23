/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Button` (@stackra/ui): every variant in every size, the
 *          default, disabled and loading states of each variant, start, end and both icons, full width, and live
 *          samples (a save that loads for a moment, a press counter).
 * Boundary: presentation and local demo state only; the button is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-416 FR-013.
 */
import { ButtonVariant, Size } from "@stackra/ui/contracts";
import { Button, Icon, Text } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Sample } from "#src/components/ui/sample";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

/** How long the live save stays loading, in milliseconds. */
const SAVE_MILLISECONDS = 1500;

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  variants: {
    title: "Variants and sizes",
    description: "One row per size, one button per variant, each labelled with its variant name.",
    size: (size: string) => `Size ${size}`,
  },
  states: {
    title: "States",
    description:
      "Each variant default, `isDisabled` and `isLoading`. A loading button refuses presses and reports busy.",
    default: "Default",
    disabled: "Disabled",
    loading: "Loading",
  },
  icons: {
    title: "Icons",
    // shortcut: the mobile app registers no icon set yet, so the samples use the two icons @stackra/ui draws itself.
    description:
      "`startIcon`, `endIcon` or both. The end icon is mirrored in right-to-left: switch to Arabic.",
    add: "Add person",
    open: "Open",
    both: "Invite",
  },
  fullWidth: {
    title: "Full width",
    description: "`isFullWidth` stretches the button to its container.",
    primary: "Primary",
    secondary: "Secondary",
  },
  live: {
    title: "Try it",
    description:
      "Press Save: it loads for a moment. The counter button counts presses; the disabled one does not.",
    save: "Save",
    saveState: (isSaving: boolean) => (isSaving ? "Saving…" : "Idle."),
    count: "Count",
    countDisabled: "Count (disabled)",
    presses: (count: number) => `Pressed ${count} ${count === 1 ? "time" : "times"}.`,
  },
} as const;

/** The Button page: one section per option, in a scrollable screen. */
export function ButtonScreen() {
  const [isSaving, setIsSaving] = useState(false);
  const [count, setCount] = useState(0);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isSaving) return undefined;
    const timer = setTimeout(() => setIsSaving(false), SAVE_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isSaving]);

  return (
    <Screen>
      <Section title={STRINGS.variants.title} description={STRINGS.variants.description}>
        {Size.map((size) => (
          <Sample key={size} caption={STRINGS.variants.size(size)}>
            <View className="flex-row flex-wrap gap-2">
              {ButtonVariant.map((variant) => (
                <Button key={variant} variant={variant} size={size}>
                  {variant}
                </Button>
              ))}
            </View>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.states.title} description={STRINGS.states.description}>
        {ButtonVariant.map((variant) => (
          <Sample key={variant} caption={variant}>
            <View className="flex-row flex-wrap gap-2">
              <Button variant={variant}>{STRINGS.states.default}</Button>
              <Button variant={variant} isDisabled>
                {STRINGS.states.disabled}
              </Button>
              <Button variant={variant} isLoading>
                {STRINGS.states.loading}
              </Button>
            </View>
          </Sample>
        ))}
      </Section>

      <Section title={STRINGS.icons.title} description={STRINGS.icons.description}>
        <View className="flex-row flex-wrap gap-4">
          <Sample caption="startIcon">
            <Button variant="secondary" startIcon="user-round">
              {STRINGS.icons.add}
            </Button>
          </Sample>
          <Sample caption="endIcon">
            <Button variant="secondary" endIcon={<Icon name="external-link" isMirroredInRtl />}>
              {STRINGS.icons.open}
            </Button>
          </Sample>
          <Sample caption="startIcon + endIcon">
            <Button
              variant="secondary"
              startIcon="user-round"
              endIcon={<Icon name="external-link" isMirroredInRtl />}
            >
              {STRINGS.icons.both}
            </Button>
          </Sample>
        </View>
      </Section>

      <Section title={STRINGS.fullWidth.title} description={STRINGS.fullWidth.description}>
        <Button isFullWidth>{STRINGS.fullWidth.primary}</Button>
        <Button variant="secondary" isFullWidth>
          {STRINGS.fullWidth.secondary}
        </Button>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <View className="flex-row flex-wrap items-center gap-3">
          <Button isLoading={isSaving} onPress={() => setIsSaving(true)}>
            {STRINGS.live.save}
          </Button>
          <Text tone="muted" accessibilityLiveRegion="polite">
            {STRINGS.live.saveState(isSaving)}
          </Text>
        </View>
        <View className="flex-row flex-wrap items-center gap-3">
          <Button onPress={() => setCount((value) => value + 1)}>{STRINGS.live.count}</Button>
          <Button isDisabled onPress={() => setCount((value) => value + 1)}>
            {STRINGS.live.countDisabled}
          </Button>
        </View>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.presses(count)}
        </Text>
      </Section>
    </Screen>
  );
}
