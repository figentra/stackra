/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `ActionMenu` (@stackra/ui): the "more actions" button with
 *          grouped actions (icons, a danger action, a refused one with its reason), the button's variant and size, a
 *          refused menu, where the menu opens, and a live menu that reports the action chosen.
 * Boundary: presentation and local demo state only; the menu is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { ActionMenu, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";
import { Icons } from "#src/constants/icons.constant";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A button named for what it acts on, opening two groups of actions.",
    label: "Actions for invoice 1042",
    open: "Open",
    edit: "Edit",
    duplicate: "Duplicate",
    archive: "Archive",
    delete: "Delete",
    actions: "Invoice actions",
    danger: "Destructive actions",
  },
  refused: {
    title: "Second lines and a refused action",
    description:
      "An action can carry a description, and one can be shown but refused: its reason replaces the description.",
    label: "Actions for invoice 1043",
    send: "Send to customer",
    sendNote: "Emails a PDF copy.",
    refund: "Refund",
    refundReason: "Only paid invoices can be refunded.",
  },
  look: {
    title: "Button",
    description: "`variant` and `size` set the button; `isDisabled` refuses opening the menu.",
    outline: "Outline, small",
    disabled: "Disabled",
    outlineLabel: "Actions, outline button",
    disabledLabel: "Actions, disabled button",
  },
  placement: {
    title: "Placement",
    description:
      "`placement` and `align` say where the menu opens against the button; it opens at the reading end by default.",
    label: "Actions, opens above at the start",
  },
  live: {
    title: "Try it",
    description: "Choose an action; the readout names the last one chosen.",
    label: "Actions for invoice 1044",
    last: (id: string | null) => `Last action: ${id ?? "none"}`,
  },
} as const;

/** The groups of the basic menu: the everyday actions, then the destructive one. */
const BASIC_SECTIONS: readonly MenuSection[] = [
  {
    id: "actions",
    title: STRINGS.basics.actions,
    isTitleHidden: true,
    items: [
      { id: "open", label: STRINGS.basics.open },
      { id: "edit", label: STRINGS.basics.edit, icon: Icons.Pencil },
      { id: "duplicate", label: STRINGS.basics.duplicate, icon: Icons.Copy },
      { id: "archive", label: STRINGS.basics.archive, icon: Icons.Archive },
    ],
  },
  {
    id: "danger",
    title: STRINGS.basics.danger,
    isTitleHidden: true,
    items: [{ id: "delete", label: STRINGS.basics.delete, icon: Icons.Trash, tone: "danger" }],
  },
];

/** The groups of the menu with a description and a refused action. */
const DETAIL_SECTIONS: readonly MenuSection[] = [
  {
    id: "invoice",
    title: STRINGS.basics.actions,
    isTitleHidden: true,
    items: [
      { id: "send", label: STRINGS.refused.send, description: STRINGS.refused.sendNote },
      {
        id: "refund",
        label: STRINGS.refused.refund,
        isDisabled: true,
        disabledReason: STRINGS.refused.refundReason,
      },
    ],
  },
];

/** The ActionMenu page: one section per option, in a scrollable screen. */
export function ActionMenuScreen() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <ActionMenu label={STRINGS.basics.label} sections={BASIC_SECTIONS} />
      </Section>

      <Section title={STRINGS.refused.title} description={STRINGS.refused.description}>
        <ActionMenu label={STRINGS.refused.label} sections={DETAIL_SECTIONS} />
      </Section>

      <Section title={STRINGS.look.title} description={STRINGS.look.description}>
        <ActionMenu
          label={STRINGS.look.outlineLabel}
          sections={BASIC_SECTIONS}
          variant="outline"
          size="sm"
        />
        <ActionMenu label={STRINGS.look.disabledLabel} sections={BASIC_SECTIONS} isDisabled />
      </Section>

      <Section title={STRINGS.placement.title} description={STRINGS.placement.description}>
        <ActionMenu
          label={STRINGS.placement.label}
          sections={BASIC_SECTIONS}
          placement="top"
          align="start"
        />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <ActionMenu label={STRINGS.live.label} sections={BASIC_SECTIONS} onAction={setLast} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.last(last)}
        </Text>
      </Section>
    </Screen>
  );
}
