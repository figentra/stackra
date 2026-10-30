/**
 * Stackra file contract:
 * Purpose: `componentMenuItems`: the component screen's ⋯ header menu as a native iOS bar item: Open HeroUI docs (when
 *          the registry knows the URL), then the previous and the next component of the category. A native item keeps
 *          its identifier across param changes, so iOS 26 carries one capsule as the reader hops between siblings.
 * Boundary: the item description only; opening a URL and the hop are the navigator's, passed in, and the translator
 *           `useCatalogueText()`'s (English when it passes none). Android keeps the React `headerRight`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) sections 1 (mobile bug), 3.3 and 4 (rows 1 and 12).
 */
import type { NativeStackHeaderItem } from "@react-navigation/native-stack";
import { formatMessage, type I18nKey } from "@stackra/i18n";
import { componentKeys, neighbours, type ComponentEntry } from "@stackra/showcase";

import { HOME_KEYS } from "../constants/home-keys.constant";
import { MESSAGES } from "../constants/messages.constant";

/** The showcase chrome's keys. */
const K = HOME_KEYS.showcase;

/** English, for a caller with no translator at hand. */
const english = (key: I18nKey, values?: Readonly<Record<string, unknown>>) =>
  formatMessage(MESSAGES.en, key, values, "en");

/** The ⋯ menu of `entry`'s screen. */
export function componentMenuItems(
  entry: ComponentEntry,
  actions: {
    readonly openUrl: (url: string) => void;
    readonly jumpTo: (target: ComponentEntry) => void;
  },
  t: (key: I18nKey, values?: Readonly<Record<string, unknown>>) => string = english,
): NativeStackHeaderItem[] {
  const docsUrl = entry.hero.native?.docsUrl;
  const { previous, next } = neighbours(entry, "native");
  const hop = (
    target: ComponentEntry | undefined,
    label: I18nKey,
    symbol: "chevron.left" | "chevron.right",
  ) =>
    target
      ? [
          {
            type: "action" as const,
            label: t(label),
            description: t(componentKeys(target).title as I18nKey),
            icon: { type: "sfSymbol" as const, name: symbol },
            onPress: () => actions.jumpTo(target),
          },
        ]
      : [];
  return [
    {
      type: "menu",
      identifier: "component-menu",
      label: t(K.ui.menu),
      accessibilityLabel: t(K.ui.menu),
      icon: { type: "sfSymbol", name: "ellipsis.circle" },
      menu: {
        items: [
          ...(docsUrl
            ? [
                {
                  type: "action" as const,
                  label: t(K.ui.open_hero_docs),
                  icon: { type: "sfSymbol" as const, name: "arrow.up.right.square" as const },
                  onPress: () => actions.openUrl(docsUrl),
                },
              ]
            : []),
          ...hop(previous, K.pager.previous, "chevron.left"),
          ...hop(next, K.pager.next, "chevron.right"),
        ],
      },
    },
  ];
}
