/**
 * Stackra file contract:
 * Purpose: the design-system review page of the native `NavigationList` (@stackra/ui): a list of places with icons and
 *          counts, the place the user is on, groups with places nested under them, a refused place, a named list, and a
 *          live list whose current place follows the press, with a readout.
 * Boundary: presentation and local demo state only; the list is @stackra/ui's, nothing here is styled by hand. The
 *          list never reads a router, so the page sets `isCurrent` itself and the places press a handler, never a path.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); STA-471.
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import { NavigationList, Text } from "@stackra/ui/native";
import { useState } from "react";

import { Screen } from "#src/components/ui/screen";
import { Section } from "#src/components/ui/section";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  basics: {
    title: "Basics",
    description: "Each place is a row with an optional icon; a count after the label is a `badge`.",
  },
  current: {
    title: "The current place",
    description:
      "`isCurrent` marks the place the user is on: it is drawn selected and announced as such.",
  },
  groups: {
    title: "Groups and nesting",
    description:
      "A place with `children` and no handler is a heading for them; a place with both is a link that has places under it.",
    named: "Settings navigation",
  },
  refused: {
    title: "A refused place",
    description: "`isDisabled` shows a place but refuses it.",
  },
  live: {
    title: "Try it",
    description: "Press a place; it becomes the current one and the readout names it.",
    current: (label: string) => `Current place: ${label}`,
  },
  places: {
    home: "Home",
    inbox: "Inbox",
    favourites: "Favourites",
    settings: "Settings",
    account: "Account",
    general: "General",
    profile: "Profile",
    security: "Security",
    notifications: "Notifications",
    billing: "Billing",
  },
} as const;

/** Does nothing: a sample whose places only show how a link looks. */
const ignore = () => undefined;

/** The places of the basic list. */
const BASIC: readonly NavigationItem[] = [
  { id: "home", label: STRINGS.places.home, icon: "layout-grid", onPress: ignore },
  { id: "inbox", label: STRINGS.places.inbox, icon: "bell", badge: 3, onPress: ignore },
  { id: "favourites", label: STRINGS.places.favourites, icon: "heart", onPress: ignore },
  { id: "settings", label: STRINGS.places.settings, icon: "settings", onPress: ignore },
];

/** The places with a heading and places nested under it. */
const GROUPED: readonly NavigationItem[] = [
  { id: "home", label: STRINGS.places.home, icon: "layout-grid", onPress: ignore },
  {
    id: "account",
    label: STRINGS.places.account,
    children: [
      { id: "profile", label: STRINGS.places.profile, onPress: ignore },
      { id: "security", label: STRINGS.places.security, onPress: ignore },
    ],
  },
  {
    id: "settings",
    label: STRINGS.places.settings,
    icon: "settings",
    onPress: ignore,
    children: [
      { id: "general", label: STRINGS.places.general, onPress: ignore },
      { id: "notifications", label: STRINGS.places.notifications, onPress: ignore },
    ],
  },
];

/** The places with a refused one. */
const WITH_REFUSED: readonly NavigationItem[] = [
  { id: "profile", label: STRINGS.places.profile, onPress: ignore },
  { id: "billing", label: STRINGS.places.billing, isDisabled: true, onPress: ignore },
  { id: "security", label: STRINGS.places.security, onPress: ignore },
];

/** The NavigationList page: one section per option, in a scrollable screen. */
export function NavigationListScreen() {
  const [currentId, setCurrentId] = useState("inbox");

  // The live places mark the one pressed as the current place.
  const live: readonly NavigationItem[] = BASIC.map((item) => ({
    ...item,
    isCurrent: item.id === currentId,
    onPress: () => setCurrentId(item.id),
  }));
  const currentLabel = live.find((item) => item.id === currentId)?.label ?? STRINGS.places.home;

  return (
    <Screen>
      <Section title={STRINGS.basics.title} description={STRINGS.basics.description}>
        <NavigationList items={BASIC} />
      </Section>

      <Section title={STRINGS.current.title} description={STRINGS.current.description}>
        <NavigationList items={BASIC.map((item) => ({ ...item, isCurrent: item.id === "home" }))} />
      </Section>

      <Section title={STRINGS.groups.title} description={STRINGS.groups.description}>
        <NavigationList items={GROUPED} label={STRINGS.groups.named} />
      </Section>

      <Section title={STRINGS.refused.title} description={STRINGS.refused.description}>
        <NavigationList items={WITH_REFUSED} />
      </Section>

      <Section title={STRINGS.live.title} description={STRINGS.live.description}>
        <NavigationList items={live} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {STRINGS.live.current(currentLabel)}
        </Text>
      </Section>
    </Screen>
  );
}
