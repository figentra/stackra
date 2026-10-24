/**
 * Stackra file contract:
 * Purpose: `registerShortcutTestingPart`, the extension point of `runShortcut`: a package's testing setup registers the
 *          part that fakes its context members, or builds the shortcut, for every test run of the process.
 * Boundary: test-process state only; registering the same name again replaces the part and moves it last, so the most
 *           recent registration wins where parts overlap. Returns the disposer that removes it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import { SHORTCUT_TESTING_PARTS } from "#testing/constants/shortcut-testing-parts.constant";
import type { ShortcutTestingPart } from "#testing/types/shortcut-testing-part.type";

/**
 * Adds `part` to every `runShortcut` of this process under `name`.
 *
 * @example
 * registerShortcutTestingPart("@stackra/navigation", () => {
 *   const navigations: { to: string; external?: boolean }[] = [];
 *   return {
 *     context: { navigate: (to: string, options = {}) => navigations.push({ to, ...options }), navigations },
 *   };
 * });
 */
export function registerShortcutTestingPart(name: string, part: ShortcutTestingPart): () => void {
  SHORTCUT_TESTING_PARTS.delete(name);
  SHORTCUT_TESTING_PARTS.set(name, part);
  return () => {
    if (SHORTCUT_TESTING_PARTS.get(name) === part) SHORTCUT_TESTING_PARTS.delete(name);
  };
}
