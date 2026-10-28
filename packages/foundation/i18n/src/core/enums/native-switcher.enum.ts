/**
 * Stackra file contract:
 * Purpose: `NativeSwitcher`, who owns a native app's language choice: the phone (its per-app language screen) or the
 *          app (a list that switches in place).
 * Boundary: an `Enum.of` value plus the type of the same name. `I18nConfig.nativeSwitcher` holds one; the `./native`
 *           entry's `nativeSwitcherMode` turns `system` into `in_app` where the OS has no per-app language screen
 *           (Android below 13). The web ignores it: there the URL selects the locale (ADR 0297 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The owners of a native app's language choice; `Enum.values(NativeSwitcher)` lists them. */
export const NativeSwitcher = Enum.of({
  /** The phone: the language row opens the OS per-app language screen (iOS, Android 13 and later); the default. */
  System: "system",
  /** The app: the language row lists the shipped locales and switches in place (tills, kiosks, shared devices). */
  InApp: "in_app",
});

/** One of the codes above. */
export type NativeSwitcher = Enum.Value<typeof NativeSwitcher>;
