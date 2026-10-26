/**
 * Stackra file contract:
 * Purpose: the reach layouts of a kiosk surface: `standing`, the whole screen, and `seated`, every control inside the
 *          lower band a seated person or a wheelchair user reaches, with larger targets.
 * Boundary: the values only; a kiosk's reach is a device setting (the device catalogue's kind and the venue), never a
 *           default in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0428 (decision 1); R3-SO-10; WCAG 2.2 SC 2.5.8.
 */

/** The kiosk reach layouts. */
// shortcut: a frozen tuple, as this package's enums are, until Enum.of reaches the contracts (ADR 0128).
export const KioskReach = Object.freeze(["standing", "seated"] as const);

/** One reach layout. */
export type KioskReach = (typeof KioskReach)[number];
