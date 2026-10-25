/**
 * Stackra file contract:
 * Purpose: the `SystemColorScheme` port: the light or dark preference of the operating system or browser, and a
 *          subscription to its changes. `ColorSchemeService` reads it while the chosen scheme is `system`.
 * Boundary: an abstract class that is its own token; a driver per runtime implements it with `extends Driver(...)`:
 *           `memory` on a server and in tests, `browser` (`prefers-color-scheme`) on the web, `appearance` (React
 *           Native's `Appearance`) on a device. Gen lists the one candidate of each target. Reads only; applying a
 *           scheme to the screen is the design system provider's job.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15, 16 and 17); ADR 0060 (light and dark); ADR 0266 (memory drivers first).
 */
import { Port } from "@stackra/contracts";
import type { ResolvedColorScheme } from "@stackra/ui/contracts";

/**
 * The system's colour preference.
 *
 * @example
 * export class BrowserSystemColorSchemeDriver extends Driver(SystemColorScheme) {
 *   current(): ResolvedColorScheme {
 *     return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
 *   }
 * }
 */
export abstract class SystemColorScheme extends Port {
  /** The preference now; `light` when the runtime has none. */
  abstract current(): ResolvedColorScheme;

  /**
   * Calls `listener` whenever the preference changes.
   *
   * @returns removes the listener; safe to call twice.
   */
  abstract subscribe(listener: () => void): () => void;
}
