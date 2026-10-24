/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `Menu` (@stackra/ui): a menu opened by any button, actions
 *          with icons, a second line and a refused one with its reason, a submenu, one choice per group and several
 *          choices, the bottom-sheet presentation, and a live menu that reports the action chosen.
 * Boundary: presentation and local demo state only; the menu is @stackra/ui's, nothing here is styled by hand.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "Any pressable element is the trigger; the menu lists its groups under it.",
    open: "Open the menu",
    file: "File",
    newFile: "New file",
    openFile: "Open file",
    danger: "Danger zone",
    delete: "Delete file",
  },
  items: {
    title: "Icons, second lines and a refused action",
    description:
      "An action can carry an icon and a description; one can be shown but refused: its reason replaces the description.",
    open: "Open the file menu",
    group: "File actions",
    edit: "Edit",
    editNote: "Opens the editor.",
    duplicate: "Duplicate",
    archive: "Archive",
    archiveReason: "Archiving is off for shared files.",
    delete: "Delete",
  },
  submenu: {
    title: "Submenu",
    description: "An action that carries `items` opens a second menu one level deep.",
    open: "Open the share menu",
    group: "Share",
    copy: "Copy link",
    share: "Share to",
    mail: "Email",
    chat: "Chat",
  },
  single: {
    title: "One choice per group",
    description:
      '`selectionMode="single"` keeps one action chosen in each group, marked with a check.',
    open: "Sort by",
    group: "Sort order",
    newest: "Newest first",
    oldest: "Oldest first",
    price: "Price",
    chosen: (keys: readonly string[]) => `Sorted by: ${keys.join(", ") || "nothing"}`,
  },
  multiple: {
    title: "Several choices",
    description: '`selectionMode="multiple"` lets any number of actions stay chosen.',
    open: "Columns",
    group: "Visible columns",
    name: "Name",
    status: "Status",
    total: "Total",
    chosen: (keys: readonly string[]) => `Showing: ${keys.join(", ") || "nothing"}`,
  },
  sheet: {
    title: "Bottom sheet",
    description:
      '`presentation="bottom-sheet"` opens the same menu as a sheet instead of a popover.',
    open: "Open as a sheet",
  },
  live: {
    title: "Try it",
    description: "Choose an action; the readout names the last one chosen.",
    open: "Open the menu to choose",
    last: (id: string | null) => `Last action: ${id ?? "none"}`,
  },
} as const;

/** The groups of the basic menu: the everyday actions, then the destructive one. */
const BASIC_SECTIONS: readonly MenuSection[] = [
  {
    id: "file",
    title: STRINGS.basics.file,
    items: [
      { id: "new", label: STRINGS.basics.newFile },
      { id: "open", label: STRINGS.basics.openFile },
    ],
  },
  {
    id: "danger",
    title: STRINGS.basics.danger,
    items: [{ id: "delete", label: STRINGS.basics.delete, tone: "danger" }],
  },
];

/** The groups of the menu with icons, a description and a refused action. */
const ITEM_SECTIONS: readonly MenuSection[] = [
  {
    id: "file",
    title: STRINGS.items.group,
    isTitleHidden: true,
    items: [
      {
        id: "edit",
        label: STRINGS.items.edit,
        description: STRINGS.items.editNote,
        icon: "pencil",
      },
      { id: "duplicate", label: STRINGS.items.duplicate, icon: "copy" },
      {
        id: "archive",
        label: STRINGS.items.archive,
        icon: "archive",
        isDisabled: true,
        disabledReason: STRINGS.items.archiveReason,
      },
      { id: "delete", label: STRINGS.items.delete, icon: "trash", tone: "danger" },
    ],
  },
];

/** The groups of the menu with a submenu. */
const SUBMENU_SECTIONS: readonly MenuSection[] = [
  {
    id: "share",
    title: STRINGS.submenu.group,
    isTitleHidden: true,
    items: [
      { id: "copy", label: STRINGS.submenu.copy, icon: "copy" },
      {
        id: "share",
        label: STRINGS.submenu.share,
        items: [
          { id: "mail", label: STRINGS.submenu.mail },
          { id: "chat", label: STRINGS.submenu.chat },
        ],
      },
    ],
  },
];

/** The group of the one-choice menu. */
const SORT_SECTIONS: readonly MenuSection[] = [
  {
    id: "sort",
    title: STRINGS.single.group,
    items: [
      { id: "newest", label: STRINGS.single.newest },
      { id: "oldest", label: STRINGS.single.oldest },
      { id: "price", label: STRINGS.single.price },
    ],
  },
];

/** The group of the several-choices menu. */
const COLUMN_SECTIONS: readonly MenuSection[] = [
  {
    id: "columns",
    title: STRINGS.multiple.group,
    items: [
      { id: "name", label: STRINGS.multiple.name },
      { id: "status", label: STRINGS.multiple.status },
      { id: "total", label: STRINGS.multiple.total },
    ],
  },
];

/** The Menu page: one section per option, in a scrollable screen. */
export function MenuScreen() {
  const [sort, setSort] = useState<readonly string[]>(["newest"]);
  const [columns, setColumns] = useState<readonly string[]>(["name", "status"]);
  const [last, setLast] = useState<string | null>(null);

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <Menu sections={BASIC_SECTIONS}>
          <Button variant="secondary">{STRINGS.basics.open}</Button>
        </Menu>
      </Section>

      <Section title={STRINGS.items.title} description={STRINGS.items.description}>
        <Menu sections={ITEM_SECTIONS}>
          <Button variant="secondary">{STRINGS.items.open}</Button>
        </Menu>
      </Section>

      <Section title={STRINGS.submenu.title} description={STRINGS.submenu.description}>
        <Menu sections={SUBMENU_SECTIONS}>
          <Button variant="secondary">{STRINGS.submenu.open}</Button>
        </Menu>
      </Section>

      <Section title={STRINGS.single.title} description={STRINGS.single.description}>
        <Menu sections={SORT_SECTIONS} selectionMode="single" value={sort} onChange={setSort}>
          <Button variant="secondary">{STRINGS.single.open}</Button>
        </Menu>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.single.chosen(sort)}
        </Text>
      </Section>

      <Section title={STRINGS.multiple.title} description={STRINGS.multiple.description}>
        <Menu
          sections={COLUMN_SECTIONS}
          selectionMode="multiple"
          value={columns}
          onChange={setColumns}
        >
          <Button variant="secondary">{STRINGS.multiple.open}</Button>
        </Menu>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.multiple.chosen(columns)}
        </Text>
      </Section>

      <Section title={STRINGS.sheet.title} description={STRINGS.sheet.description}>
        <Menu sections={BASIC_SECTIONS} presentation="bottom-sheet">
          <Button variant="secondary">{STRINGS.sheet.open}</Button>
        </Menu>
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <Menu sections={ITEM_SECTIONS} onAction={setLast}>
          <Button variant="secondary">{STRINGS.live.open}</Button>
        </Menu>
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.last(last)}
        </Text>
      </Section>
    </Screen>
  );
}
