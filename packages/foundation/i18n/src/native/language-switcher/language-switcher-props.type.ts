/**
 * Stackra file contract:
 * Purpose: `LanguageSwitcherProps`, the props of `<LanguageSwitcher />`: the switcher options and the render function
 *          that draws the row (or the list) from the switcher's state.
 * Boundary: type only.
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534).
 */
import type { ReactNode } from "react";

import type { LanguageSwitcherOptions } from "./language-switcher-options.type";
import type { LanguageSwitcherState } from "./language-switcher-state.type";

/** The props of `LanguageSwitcher`. */
export interface LanguageSwitcherProps extends LanguageSwitcherOptions {
  /** Draws the language row from the switcher: one Settings row under `system`, the locale list under `in_app`. */
  readonly children: (switcher: LanguageSwitcherState) => ReactNode;
}
