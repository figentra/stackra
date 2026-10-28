/**
 * Stackra file contract:
 * Purpose: `AccessibilitySettings`, the device or browser accessibility settings an app follows and never overrides:
 *          reduce motion, bold text, high contrast and the text size (font scale).
 * Boundary: a type only. A value of it is a frozen snapshot that a `SystemAccessibility` driver replaces on every
 *           change, so a render compares it by identity.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note: the app follows the system's accessibility settings).
 */

/** The system's accessibility settings, as a component reads them. */
export interface AccessibilitySettings {
  /** Whether the user asked for less motion; animations collapse to fades or nothing. */
  readonly reduceMotion: boolean;

  /** Whether the user asked for bold text (iOS Bold Text); `false` where the runtime has no such setting. */
  readonly boldText: boolean;

  /** Whether the user asked for more contrast (iOS Darker Colors, Android high-contrast text, `prefers-contrast`). */
  readonly highContrast: boolean;

  /** The text size multiplier the user chose (Dynamic Type on iOS, font scale on Android); `1` on the web. */
  readonly fontScale: number;
}
