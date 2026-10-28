/**
 * Stackra file contract:
 * Purpose: `<LanguageSwitcher />`, the component form of `useLanguageSwitcher()` for a settings screen: it hands its
 *          render function the switcher, the same in both modes.
 * Boundary: headless: it draws nothing itself, so an app draws the row with its own design system (`@stackra/ui`
 *           sits above this package).
 * Runtime: react-native
 * Governing contract: ADR 0080 (2026-10-29 note, STA-1534), ADR 0305 (class components: hooks as fields).
 */
import type { ReactNode } from "react";

import type { LanguageSwitcherProps } from "./language-switcher-props.type";
import { useLanguageSwitcher } from "./use-language-switcher";

/**
 * Hands its render function the native language switcher.
 *
 * @throws Error outside an `I18nProvider`.
 * @example
 * <LanguageSwitcher reload={Updates.reloadAsync}>
 *   {(switcher) => <Row label={switcher.endonym(switcher.locale)} onPress={() => switcher.choose(switcher.locale)} />}
 * </LanguageSwitcher>
 */
export function LanguageSwitcher({ children, reload }: LanguageSwitcherProps): ReactNode {
  return children(useLanguageSwitcher({ reload }));
}
