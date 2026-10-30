/**
 * Stackra file contract:
 * Purpose: the display switcher of the design-system review area, where the web playground keeps it in its glass bar:
 *          a header button on the landing and on every page that opens an inset sheet with the colour scheme, the
 *          language and direction and the digits choices, which drive `useDesignSystem()`, so any page can be checked in each
 *          combination without leaving it, and the app-wide haptics switch (`useHaptics()`).
 * Boundary: the button, the sheet's open state, the two choice groups and the switch; the display state is the
 *           provider's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); ADR 0320 (the showcase).
 */
import { ColorScheme } from "@stackra/ui/contracts";
import {
  IconButton,
  Switch,
  useCatalogueText,
  useDesignSystem,
  useHaptics,
} from "@stackra/ui/native";
import { BottomSheet } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "../../constants/messages.constant";
import { SHELL_KEYS } from "../../constants/shell-keys.constant";
import { ChoiceGroup } from "./choice-group";
import { useInsetSheet } from "./use-inset-sheet";
import { ReviewIcons } from "./review-icons";
import { numeralsChoice } from "../../stores/numerals-choice.store";
import { useNumeralsChoice } from "../../stores/use-numerals-choice";

/** The shell's keys. */
const K = SHELL_KEYS.shell;

/** The languages, each named in its own language and never translated. */
const LANGUAGES = [
  { value: "en", label: "English (LTR)" },
  { value: "ar", label: "\u2067العربية\u2069 (RTL)" },
] as const;

/** The header button and its display sheet. */
function DisplaySettingsSheet() {
  const { colorScheme, resolvedColorScheme, setColorScheme, locale, setLocale } = useDesignSystem();
  const [isOpen, setOpen] = useState(false);
  const insetSheet = useInsetSheet();
  const haptics = useHaptics();
  const t = useCatalogueText(MESSAGES.en);
  const numerals = useNumeralsChoice();
  const schemes = ColorScheme.map((scheme) => ({ value: scheme, label: t(K.scheme[scheme]) }));

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={setOpen}>
      <IconButton
        icon={resolvedColorScheme === "dark" ? "moon" : "sun"}
        label={t(K.open)}
        variant="ghost"
        size="sm"
        onPress={() => setOpen(true)}
      />
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content {...insetSheet}>
          <View className="gap-5 pb-2">
            <View className="gap-1">
              <BottomSheet.Title>{t(K.title)}</BottomSheet.Title>
              <BottomSheet.Description>{t(K.description)}</BottomSheet.Description>
            </View>
            <ChoiceGroup
              label={t(K.color_scheme)}
              choices={schemes}
              value={colorScheme}
              onChange={setColorScheme}
            />
            <ChoiceGroup
              label={t(K.language)}
              choices={LANGUAGES}
              value={locale}
              onChange={setLocale}
            />
            <ChoiceGroup
              label={t(K.digits)}
              choices={numeralsChoice.offered.map((id) => ({
                value: id,
                label: t(K.numerals[id]),
              }))}
              value={numerals}
              onChange={numeralsChoice.set}
            />
            <Switch label={t(K.haptics)} value={haptics.isEnabled} onChange={haptics.setEnabled} />
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
