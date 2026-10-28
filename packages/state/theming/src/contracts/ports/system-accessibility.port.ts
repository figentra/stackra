/**
 * Stackra file contract:
 * Purpose: the `SystemAccessibility` port: the operating system's or browser's accessibility settings (reduce motion,
 *          bold text, high contrast, text size) and a subscription to their changes. `useAccessibility()` reads it.
 * Boundary: an abstract class that is its own token; a driver per runtime implements it with `extends Driver(...)`:
 *           `memory` on a server and in tests, `browser` (`prefers-reduced-motion`, `prefers-contrast`) on the web,
 *           `accessibility-info` (React Native's `AccessibilityInfo` and font scale) on a device. Reads only: the app
 *           always follows these settings and offers no override (owner decision 2026-10-29).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3, 2026-10-29 note); ADR 0294 (decision 15); ADR 0266 (memory drivers first).
 */
import { Port } from "@stackra/contracts";

import type { AccessibilitySettings } from "#contracts/types/accessibility-settings.type";

/**
 * The system's accessibility settings.
 *
 * @example
 * export class MemorySystemAccessibilityDriver extends Driver(SystemAccessibility) {
 *   current(): AccessibilitySettings {
 *     return DEFAULT_ACCESSIBILITY_SETTINGS;
 *   }
 * }
 */
export abstract class SystemAccessibility extends Port {
  /** The settings now: the same object until one of them changes; `DEFAULT_ACCESSIBILITY_SETTINGS` before any answer. */
  abstract current(): AccessibilitySettings;

  /**
   * Calls `listener` whenever a setting changes.
   *
   * @returns removes the listener; safe to call twice.
   */
  abstract subscribe(listener: () => void): () => void;
}
