/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ToggleButtonGroup` (@stackra-pro/ui): single and multiple
 *          selection, a detached group, a vertical group, full width, the sizes and the disabled state.
 * Boundary: presentation and local demo state only; the group is @stackra-pro/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 12); STA-416 FR-013.
 */
import { Text } from "@stackra/ui/native";
import { ToggleButton, ToggleButtonGroup } from "@stackra-pro/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  single: {
    title: "Single selection",
    description: "One toggle at a time; the selection is controlled with `selectedKeys`.",
    label: "Text alignment",
    items: [
      { id: "start", label: "Start" },
      { id: "center", label: "Center" },
      { id: "end", label: "End" },
    ],
    status: "Selected:",
    none: "none",
  },
  multiple: {
    title: "Multiple selection",
    description: '`selectionMode="multiple"` lets any number of toggles stay on.',
    label: "Text style",
    items: [
      { id: "bold", label: "Bold" },
      { id: "italic", label: "Italic" },
      { id: "underline", label: "Underline" },
    ],
  },
  detached: {
    title: "Detached",
    description: "`isDetached` renders separate rounded toggles with gaps.",
    label: "View mode, detached",
  },
  vertical: {
    title: "Vertical",
    description: '`orientation="vertical"` stacks the toggles in a column.',
    label: "View mode, vertical",
  },
  fullWidth: {
    title: "Full width",
    description: "`isFullWidth` stretches the group and shares the width equally.",
    label: "View mode, full width",
  },
  sizes: {
    title: "Sizes",
    description: "`size` reaches every toggle in the group.",
    items: [
      { size: "sm", label: "Small group" },
      { size: "md", label: "Medium group" },
      { size: "lg", label: "Large group" },
    ],
  },
  disabled: {
    title: "Disabled",
    description: "`isDisabled` on the group disables every toggle in it.",
    label: "View mode, disabled",
  },
} as const;

const VIEW_MODES = [
  { id: "list", label: "List" },
  { id: "grid", label: "Grid" },
  { id: "board", label: "Board" },
];

/** One group of the three view modes, so the layout sections differ only in their props. */
function ViewModes({ id }: { id: string }) {
  return (
    <>
      {VIEW_MODES.map((mode) => (
        <ToggleButton key={`${id}-${mode.id}`} id={mode.id} label={mode.label}>
          {mode.label}
        </ToggleButton>
      ))}
    </>
  );
}

/** The ToggleButtonGroup page: one section per layout and state, in a scrollable screen. */
export function ToggleButtonGroupScreen() {
  const [alignment, setAlignment] = useState<Set<string>>(new Set(["start"]));
  const selected = [...alignment][0] ?? STRINGS.single.none;

  return (
    <Screen>
      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <ToggleButtonGroup
          label={STRINGS.single.label}
          selectedKeys={alignment}
          onSelectionChange={setAlignment}
          disallowEmptySelection
        >
          {STRINGS.single.items.map((item) => (
            <ToggleButton key={item.id} id={item.id} label={item.label}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Text type="small" tone="muted" accessibilityLiveRegion="polite">
          {`${STRINGS.single.status} ${selected}`}
        </Text>
      </Section>

      <Section title={STRINGS.multiple.title} description={STRINGS.multiple.description}>
        <ToggleButtonGroup
          label={STRINGS.multiple.label}
          selectionMode="multiple"
          defaultSelectedKeys={["bold"]}
        >
          {STRINGS.multiple.items.map((item) => (
            <ToggleButton key={item.id} id={item.id} label={item.label}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Section>

      <Section title={STRINGS.detached.title} description={STRINGS.detached.description}>
        <ToggleButtonGroup label={STRINGS.detached.label} isDetached defaultSelectedKeys={["list"]}>
          <ViewModes id="detached" />
        </ToggleButtonGroup>
      </Section>

      <Section title={STRINGS.vertical.title} description={STRINGS.vertical.description}>
        <ToggleButtonGroup
          label={STRINGS.vertical.label}
          orientation="vertical"
          defaultSelectedKeys={["grid"]}
        >
          <ViewModes id="vertical" />
        </ToggleButtonGroup>
      </Section>

      <Section title={STRINGS.fullWidth.title} description={STRINGS.fullWidth.description}>
        <ToggleButtonGroup
          label={STRINGS.fullWidth.label}
          isFullWidth
          defaultSelectedKeys={["board"]}
        >
          <ViewModes id="full" />
        </ToggleButtonGroup>
      </Section>

      <Section title={STRINGS.sizes.title} description={STRINGS.sizes.description}>
        {STRINGS.sizes.items.map(({ size, label }) => (
          <ToggleButtonGroup key={size} label={label} size={size} defaultSelectedKeys={["list"]}>
            <ViewModes id={size} />
          </ToggleButtonGroup>
        ))}
      </Section>

      <Section title={STRINGS.disabled.title} description={STRINGS.disabled.description}>
        <ToggleButtonGroup label={STRINGS.disabled.label} isDisabled defaultSelectedKeys={["list"]}>
          <ViewModes id="disabled" />
        </ToggleButtonGroup>
      </Section>
    </Screen>
  );
}
