/**
 * Stackra file contract:
 * Purpose: `APP_SHORTCUT_CAPABILITY`, the capability code an `AppShortcuts` refusal names.
 * Boundary: a code only; it is not a `PlatformCapability` case until code asks `platform.has` about it.
 * Runtime: isomorphic
 * Governing contract: ADR 0250 (decision 3); ADR 0231 (snake_case codes); STA-1539.
 */

/** The capability code of a refused shortcut donation. */
export const APP_SHORTCUT_CAPABILITY = "app_shortcut";
