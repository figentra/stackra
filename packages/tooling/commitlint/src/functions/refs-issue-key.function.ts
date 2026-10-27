/**
 * Stackra file contract:
 * Purpose: `refsIssueKey`, the `refs-issue-key` plugin rule: a keyed commit carries a `Refs: <PREFIX>-n` footer
 *          (ADR 0065 rule 4); it always passes when no prefix is given.
 * Boundary: reads the parsed commit only; no repo-specific prefix lives here.
 * Runtime: node
 * Governing contract: ADR 0065 (Linear gate checked offline); ADR 0007 (documentation).
 */
import { KEYED_TYPES } from "../constants/keyed-types.constant.ts";

/** The parsed-commit fields the rule reads. */
type CommitParts = { type?: string | null; raw?: string };

/** Passes when the commit is unkeyed or carries `Refs: <prefix>-n`; always passes when no prefix is given. */
export function refsIssueKey(
  { type, raw }: CommitParts,
  when: "always" | "never" = "always",
  prefix?: string,
): [boolean, string] {
  const message = `${KEYED_TYPES.join("/")} commits need a "Refs: ${prefix}-n" footer`;
  if (!prefix) return [true, message];
  const keyed = KEYED_TYPES.includes(type ?? "");
  const has = new RegExp(`^Refs:\\s*${prefix}-\\d+\\b`, "m").test(raw ?? "");
  return [when === "never" ? !keyed || !has : !keyed || has, message];
}
