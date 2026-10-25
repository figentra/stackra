/**
 * Stackra file contract:
 * Purpose: the display switcher of the design-system review area, where the web playground keeps it in its glass bar:
 *          a header button on the landing and on every page that opens an inset sheet with the colour scheme and the
 *          language and direction choices, which drive `useDesignSystem()`, so any page can be checked in each
 *          combination without leaving it.
 * Boundary: the button, the sheet's open state and the two choice groups; the display state is the provider's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); ADR 0320 (the showcase).
 */
import { ColorScheme } from "@stackra/ui/contracts";
import { IconButton, useDesignSystem } from "@stackra/ui/native";
import { BottomSheet } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { ChoiceGroup } from "./choice-group";
import { useInsetSheet } from "./inset-sheet";
import { ReviewIcons } from "./review-icons";

// shortcut: English strings in one place until @stackra/i18n reaches the mobile app; then keys.
const STRINGS = {
  open: "Display settings",
  title: "Display",
  description:
    "Every page follows the colour scheme and the language, so each component can be checked in each combination.",
  scheme: {
    label: "Colour scheme",
    names: { light: "Light", dark: "Dark", system: "System" },
  },
  language: {
    label: "Language and direction",
    english: "English (LTR)",
    arabic: "العربية (RTL)",
  },
} as const;

const SCHEMES = ColorScheme.map((scheme) => ({
  value: scheme,
  label: STRINGS.scheme.names[scheme],
}));

const LANGUAGES = [
  { value: "en", label: STRINGS.language.english },
  { value: "ar", label: STRINGS.language.arabic },
] as const;

/** The header button and its display sheet. */
function DisplaySettingsSheet() {
  const { colorScheme, resolvedColorScheme, setColorScheme, locale, setLocale } = useDesignSystem();
  const [isOpen, setOpen] = useState(false);
  const insetSheet = useInsetSheet();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
      <IconButton
        icon={resolvedColorScheme === "dark" ? "moon" : "sun"}
        label={STRINGS.open}
        variant="ghost"
        size="sm"
        onPress={() => setOpen(true)}
      />
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content {...insetSheet}>
          <View className="gap-5 pb-2">
            <View className="gap-1">
              <BottomSheet.Title>{STRINGS.title}</BottomSheet.Title>
              <BottomSheet.Description>{STRINGS.description}</BottomSheet.Description>
            </View>
            <ChoiceGroup
              label={STRINGS.scheme.label}
              choices={SCHEMES}
              value={colorScheme}
              onChange={setColorScheme}
            />
            <ChoiceGroup
              label={STRINGS.language.label}
              choices={LANGUAGES}
              value={locale}
              onChange={setLocale}
            />
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

/** The display switcher in a review header, which sits outside the screens, with the area's icons. */
export function DisplaySettings() {
  return (
    <ReviewIcons>
      <DisplaySettingsSheet />
    </ReviewIcons>
  );
}
