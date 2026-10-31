/**
 * Stackra file contract:
 * Purpose: `resolveShortcutStep`, a normal-form step with `mod` replaced by what it is on the platform (`meta` on Apple
 *          devices, `ctrl` elsewhere), modifiers back in normal-form order.
 * Boundary: pure and internal; the conflict detector and key matching compare resolved steps.
 * Runtime: isomorphic
 * Governing contract: registry v3.1 final review H (conflict checks); ADR 0508 (matching).
 */
import { MODIFIERS } from "#core/constants/modifiers.constant";

/**
 * The step on one platform.
 *
 * @example
 * resolveShortcutStep("mod+k", true); // "meta+k"
 */
export function resolveShortcutStep(step: string, apple: boolean): string {
  const parts = step.split("+");
  const modifiers = new Set(
    parts
      .slice(0, -1)
      .map((modifier) => (modifier === "mod" ? (apple ? "meta" : "ctrl") : modifier)),
  );
  return [...MODIFIERS.filter((modifier) => modifiers.has(modifier)), parts.at(-1)].join("+");
}
