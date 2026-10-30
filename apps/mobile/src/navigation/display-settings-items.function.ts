/**
 * Stackra file contract:
 * Purpose: `displaySettingsItems`: the review header's display switcher as a native iOS bar item, a sun or moon SF
 *          Symbol that opens a menu of the colour scheme and the language choices and, given their state, the digits, the brand
 *          family submenu, the landing hero submenu and the haptics switch. A native item keeps its identifier
 *          across pushes, so iOS 26 carries it from page to page instead of fading in a new glass capsule each time,
 *          as it does for a custom React header view.
 * Boundary: the item description only; the state and setters are `useDesignSystem()`'s, and the translator
 *           `useCatalogueText()`'s, passed in by the navigator (English when it passes none).
 *           Android keeps the React `DisplaySettings` button (`headerRight`), which native-stack falls back to.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); ADR 0320 (glass and the showcase stage).
 */
import type { NativeStackHeaderItem } from "@react-navigation/native-stack";
import { formatMessage, type I18nKey } from "@stackra/i18n";
import { ColorScheme, type DesignSystemState } from "@stackra/ui/contracts";

import { MESSAGES } from "../constants/messages.constant";
import { SHELL_KEYS } from "../constants/shell-keys.constant";

/** The shell's keys. */
const K = SHELL_KEYS.shell;

/** The languages, each named in its own language and never translated. */
// The Arabic name is an RTL isolate, so "(RTL)" stays after it in a left-to-right menu.
const LANGUAGES = { en: "English (LTR)", ar: "\u2067العربية\u2069 (RTL)" } as const;

/** English, for a caller with no translator at hand. */
const english = (key: I18nKey) => formatMessage(MESSAGES.en, key, undefined, "en");

const SCHEME_SYMBOLS = {
  light: "sun.max",
  dark: "moon",
  system: "circle.lefthalf.filled",
} as const;

/** The display switcher as a native header menu, with the current scheme and locale checked. */
export function displaySettingsItems(
  state: Pick<
    DesignSystemState,
    "colorScheme" | "resolvedColorScheme" | "locale" | "setColorScheme" | "setLocale"
  >,
  t: (key: I18nKey) => string = english,
  haptics?: { isEnabled: boolean; setEnabled: (next: boolean) => void },
  brands?: {
    items: readonly { id: string; label: string }[];
    current: string | undefined;
    onSelect: (id: string) => void;
  },
  heroes?: {
    label: string;
    items: readonly { id: string; label: string }[];
    current: string | undefined;
    onSelect: (id: string) => void;
  },
  numerals?: {
    items: readonly { id: string; label: string }[];
    current: string;
    onSelect: (id: string) => void;
  },
): NativeStackHeaderItem[] {
  return [
    {
      type: "menu",
      identifier: "display-settings",
      label: t(K.open),
      accessibilityLabel: t(K.open),
      icon: { type: "sfSymbol", name: SCHEME_SYMBOLS[state.resolvedColorScheme] },
      menu: {
        items: [
          {
            type: "submenu",
            label: t(K.color_scheme),
            inline: true,
            items: ColorScheme.map((scheme) => ({
              type: "action" as const,
              label: t(K.scheme[scheme]),
              icon: { type: "sfSymbol" as const, name: SCHEME_SYMBOLS[scheme] },
              state: scheme === state.colorScheme ? ("on" as const) : ("off" as const),
              onPress: () => state.setColorScheme(scheme),
            })),
          },
          {
            type: "submenu",
            label: t(K.language),
            inline: true,
            items: (["en", "ar"] as const).map((locale) => ({
              type: "action" as const,
              label: LANGUAGES[locale],
              state: state.locale.startsWith(locale) ? ("on" as const) : ("off" as const),
              onPress: () => state.setLocale(locale),
            })),
          },
          ...(numerals
            ? [
                {
                  type: "submenu" as const,
                  label: t(K.digits),
                  inline: true,
                  items: numerals.items.map(({ id, label }) => ({
                    type: "action" as const,
                    label,
                    state: id === numerals.current ? ("on" as const) : ("off" as const),
                    onPress: () => numerals.onSelect(id),
                  })),
                },
              ]
            : []),
          ...(brands
            ? [
                {
                  type: "submenu" as const,
                  label: t(K.brand),
                  icon: { type: "sfSymbol" as const, name: "paintpalette" as const },
                  items: brands.items.map(({ id, label }) => ({
                    type: "action" as const,
                    label,
                    state: id === brands.current ? ("on" as const) : ("off" as const),
                    onPress: () => brands.onSelect(id),
                  })),
                },
              ]
            : []),
          ...(heroes
            ? [
                {
                  type: "submenu" as const,
                  label: heroes.label,
                  icon: { type: "sfSymbol" as const, name: "sparkles" as const },
                  items: heroes.items.map(({ id, label }) => ({
                    type: "action" as const,
                    label,
                    state: id === heroes.current ? ("on" as const) : ("off" as const),
                    onPress: () => heroes.onSelect(id),
                  })),
                },
              ]
            : []),
          ...(haptics
            ? [
                {
                  type: "action" as const,
                  label: t(K.haptics),
                  icon: { type: "sfSymbol" as const, name: "hand.tap" as const },
                  state: haptics.isEnabled ? ("on" as const) : ("off" as const),
                  onPress: () => haptics.setEnabled(!haptics.isEnabled),
                },
              ]
            : []),
        ],
      },
    },
  ];
}
