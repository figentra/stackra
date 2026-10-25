/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `PageHeader` (@stackra/ui): a title with a description, the
 *          breadcrumb trail above it, a status beside it, leading and trailing content, and the page's actions (three
 *          show as buttons, the rest go in a menu), with a readout of the action chosen.
 * Boundary: presentation and local demo state only; the header is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { BreadcrumbItem, MenuLeafItem } from "@stackra/ui/contracts";
import { Avatar, Chip, PageHeader, StatusBadge, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "A title with a line under it; the title is the page's heading.",
    heading: "Orders",
    body: "Every order placed in your shop, newest first.",
  },
  trail: {
    title: "Breadcrumbs and status",
    description:
      "`breadcrumbs` draw the trail above the title and `status` sits beside it, usually a `StatusBadge`.",
    heading: "Order 1042",
    body: "Placed on 24 October 2026.",
    status: "Paid",
    home: "Home",
    orders: "Orders",
    current: "Order 1042",
  },
  slots: {
    title: "Leading and trailing content",
    description:
      "`startContent` leads the title, such as an avatar; `endContent` follows the actions.",
    heading: "Ada Lovelace",
    body: "Customer since 2024.",
    chip: "VIP",
  },
  actions: {
    title: "Actions",
    description:
      "The first action is primary and at most three show as buttons; the rest go in a menu under a button of its own.",
    heading: "Invoice 1042",
    body: "Due on the first of next month.",
    moreLabel: "More invoice actions",
    send: "Send",
    download: "Download",
    edit: "Edit",
    duplicate: "Duplicate",
    delete: "Delete",
    last: (id: string | null) => `Last action: ${id ?? "none"}`,
  },
} as const;

/** The trail of the second sample; the earlier steps press nothing, the page has no router. */
const TRAIL: readonly BreadcrumbItem[] = [
  { id: "home", label: STRINGS.trail.home, onPress: () => undefined },
  { id: "orders", label: STRINGS.trail.orders, onPress: () => undefined },
  { id: "order", label: STRINGS.trail.current },
];

/** The PageHeader page: one section per option, in a scrollable screen. */
export function PageHeaderScreen() {
  const [last, setLast] = useState<string | null>(null);

  const actions: readonly MenuLeafItem[] = [
    {
      id: "send",
      label: STRINGS.actions.send,
      icon: "send-horizontal",
      onPress: () => setLast("send"),
    },
    {
      id: "download",
      label: STRINGS.actions.download,
      icon: "download",
      onPress: () => setLast("download"),
    },
    { id: "edit", label: STRINGS.actions.edit, icon: "pencil", onPress: () => setLast("edit") },
    {
      id: "duplicate",
      label: STRINGS.actions.duplicate,
      icon: "copy",
      onPress: () => setLast("duplicate"),
    },
    {
      id: "delete",
      label: STRINGS.actions.delete,
      icon: "trash",
      tone: "danger",
      onPress: () => setLast("delete"),
    },
  ];

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <PageHeader title={STRINGS.basics.heading} description={STRINGS.basics.body} />
      </Section>

      <Section title={STRINGS.trail.title} description={STRINGS.trail.description}>
        <PageHeader
          title={STRINGS.trail.heading}
          description={STRINGS.trail.body}
          breadcrumbs={TRAIL}
          status={<StatusBadge tone="success">{STRINGS.trail.status}</StatusBadge>}
        />
      </Section>

      <Section title={STRINGS.slots.title} description={STRINGS.slots.description}>
        <PageHeader
          title={STRINGS.slots.heading}
          description={STRINGS.slots.body}
          startContent={<Avatar name={STRINGS.slots.heading} />}
          endContent={<Chip size="sm">{STRINGS.slots.chip}</Chip>}
        />
      </Section>

      <Section title={STRINGS.actions.title} description={STRINGS.actions.description}>
        <PageHeader
          title={STRINGS.actions.heading}
          description={STRINGS.actions.body}
          actions={actions}
          moreActionsLabel={STRINGS.actions.moreLabel}
        />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.actions.last(last)}
        </Text>
      </Section>
    </Screen>
  );
}
