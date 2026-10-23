/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `SplitView` (@stackra/ui-pro): two panes divided by a
 *          draggable handle that snaps to set heights, one whose snap index is controlled from buttons, and one with
 *          its animations off.
 * Boundary: presentation and local demo state only; the split view is @stackra/ui-pro's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { SplitView } from "@stackra/ui-pro/native";
import { Typography } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { ChoiceGroup } from "#src/components/ui/choice-group";
import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basic: {
    title: "Drag to resize",
    description: "Drag the handle; the divider snaps to 20, 50 or 80 percent of the height.",
    handle: "Resize the panes",
    top: "Top pane",
    bottom: "Bottom pane",
  },
  controlled: {
    title: "Controlled snap point",
    description: "`snapIndex` follows the buttons, and `onSnapIndexChange` follows the drag.",
    handle: "Resize the controlled panes",
    group: "Snap point",
    small: "Small",
    half: "Half",
    large: "Large",
    value: "Snap index:",
  },
  still: {
    title: "No animation",
    description: '`animation="disable-all"` moves the divider without a spring.',
    handle: "Resize the panes without animation",
  },
} as const;

const SNAP_CHOICES = [
  { value: "0", label: STRINGS.controlled.small },
  { value: "1", label: STRINGS.controlled.half },
  { value: "2", label: STRINGS.controlled.large },
] as const;

/** One bordered pane with a line of text, so the panes read as separate surfaces. */
function Pane({ text }: { text: string }) {
  return (
    <View className="flex-1 items-center justify-center rounded-3xl bg-surface p-4">
      <Typography.Paragraph>{text}</Typography.Paragraph>
    </View>
  );
}

/** The SplitView page: one section per behaviour, in a scrollable screen. */
export function SplitViewScreen() {
  const [snapIndex, setSnapIndex] = useState(1);

  return (
    <Screen>
      <Section title={STRINGS.basic.title} description={STRINGS.basic.description}>
        <View className="h-80 overflow-hidden rounded-3xl bg-surface-secondary p-2">
          <SplitView minHeight={50} maxHeight={1}>
            <SplitView.TopSection>
              <Pane text={STRINGS.basic.top} />
            </SplitView.TopSection>
            <SplitView.DragArea label={STRINGS.basic.handle} className="h-5">
              <SplitView.DragHandle />
            </SplitView.DragArea>
            <SplitView.BottomSection>
              <Pane text={STRINGS.basic.bottom} />
            </SplitView.BottomSection>
          </SplitView>
        </View>
      </Section>

      <Section title={STRINGS.controlled.title} description={STRINGS.controlled.description}>
        <ChoiceGroup
          label={STRINGS.controlled.group}
          choices={SNAP_CHOICES}
          value={String(snapIndex) as "0" | "1" | "2"}
          onChange={(next) => setSnapIndex(Number(next))}
        />
        <View className="h-80 overflow-hidden rounded-3xl bg-surface-secondary p-2">
          <SplitView
            minHeight={50}
            maxHeight={1}
            snapIndex={snapIndex}
            onSnapIndexChange={setSnapIndex}
          >
            <SplitView.TopSection>
              <Pane text={STRINGS.basic.top} />
            </SplitView.TopSection>
            <SplitView.DragArea label={STRINGS.controlled.handle} className="h-5">
              <SplitView.DragHandle />
            </SplitView.DragArea>
            <SplitView.BottomSection>
              <Pane text={STRINGS.basic.bottom} />
            </SplitView.BottomSection>
          </SplitView>
        </View>
        <Typography.Paragraph type="body-sm" color="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.controlled.value} ${snapIndex}`}
        </Typography.Paragraph>
      </Section>

      <Section title={STRINGS.still.title} description={STRINGS.still.description}>
        <View className="h-80 overflow-hidden rounded-3xl bg-surface-secondary p-2">
          <SplitView minHeight={50} maxHeight={1} animation="disable-all">
            <SplitView.TopSection>
              <Pane text={STRINGS.basic.top} />
            </SplitView.TopSection>
            <SplitView.DragArea label={STRINGS.still.handle} className="h-5">
              <SplitView.DragHandle />
            </SplitView.DragArea>
            <SplitView.BottomSection>
              <Pane text={STRINGS.basic.bottom} />
            </SplitView.BottomSection>
          </SplitView>
        </View>
      </Section>
    </Screen>
  );
}
