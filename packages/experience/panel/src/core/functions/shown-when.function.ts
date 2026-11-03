/**
 * Stackra file contract:
 * Purpose: `shownWhen(path, values)`, whether a spec with `visibleWhen` shows: true without a path, else true only while the
 *          value at the path of the record (or the form's values) is `true`.
 * Boundary: internal; pure. A missing or non-boolean value hides, so a predicate the server forgot to send never shows
 *           an action it guards. Web and native renderers share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 3); the SDUI catalogue cases `actionButton`, `rowActions` and `formFields`
 *                     (STA-1981).
 */
import { valueAt } from "#core/functions/value-at.function";

/**
 * Whether a spec guarded by `path` shows over `values`.
 *
 * @example
 * shownWhen("isCancellable", order); // false unless order.isCancellable === true
 */
export function shownWhen(path: string | undefined, values: unknown): boolean {
  return path === undefined || valueAt(values, path) === true;
}
