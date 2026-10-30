/**
 * Stackra file contract:
 * Purpose: `mediaTimeOf(seconds, numerals)`, a media position or length as a player writes it: "0:07", "12:30",
 *          "1:02:03", in the customer's digits. A length not known yet (NaN, Infinity) or below zero is "0:00".
 * Boundary: pure; whole seconds, rounded down.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (digits); STA-1371 (wave D, owner approval 2026-10-30).
 */
import { type NumberingSystem, withDigits } from "@stackra/i18n";

/** Two digits, with a leading zero. */
const two = (n: number) => String(n).padStart(2, "0");

/**
 * The written time.
 * @example mediaTimeOf(3723, "latn"); // "1:02:03"
 */
export function mediaTimeOf(seconds: number, numerals: NumberingSystem): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const text =
    hours > 0 ? `${hours}:${two(minutes)}:${two(total % 60)}` : `${minutes}:${two(total % 60)}`;
  return withDigits(text, numerals);
}
