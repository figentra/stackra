/**
 * Stackra file contract:
 * Purpose: `restoreDisplayPrefs`: at launch, puts the remembered brand, transition preset and haptics switch back into
 *          their stores, then remembers every later change of the transition and the haptics switch, wherever it is
 *          made (Settings, the header menu, the display sheet). The colour scheme and language are restored through
 *          `DesignSystemProvider`'s `default…` props and the brand is remembered where it is picked (Settings).
 * Boundary: wiring only; call it once, before the first render. Returns the unsubscribe, for tests.
 * Runtime: react-native
 * Governing contract: ADR 0256 (client storage); ADR 0320 (the Theme Studio).
 */
import { haptics } from "@stackra/ui/native";

import { BRAND_THEMES } from "../constants/brand-themes.constant";
import { displayPrefs } from "./display-prefs.store";
import { themeSettings } from "./theme-settings.store";
import { themeTransition } from "./theme-transition.store";

/** Restores the remembered settings and starts remembering changes. */
export function restoreDisplayPrefs(): () => void {
  const brand = BRAND_THEMES.find(({ id }) => id === displayPrefs.get("brand"));
  // Figentra is the store's own start, so only another brand is dispatched (it would add an undo step otherwise).
  if (brand && brand.id !== BRAND_THEMES[0]?.id)
    themeSettings.dispatch({ type: "change", step: { base: brand.theme, knobs: {} } });
  const preset = Number(displayPrefs.get("transition"));
  if (displayPrefs.get("transition") !== undefined && Number.isInteger(preset))
    themeTransition.setPreset(preset);
  haptics.setEnabled(displayPrefs.get("haptics") !== "off");
  const stopTransition = themeTransition.subscribe(() =>
    displayPrefs.set("transition", String(themeTransition.getSnapshot())),
  );
  const stopHaptics = haptics.subscribe(() =>
    displayPrefs.set("haptics", haptics.isEnabled() ? "on" : "off"),
  );
  return () => {
    stopTransition();
    stopHaptics();
  };
}
