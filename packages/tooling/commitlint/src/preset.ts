/**
 * Stackra file contract:
 * Purpose: the shared commitlint preset. Conventional commits plus the house type list, subject case and lengths,
 *          and the `refs-issue-key` plugin rule, which is OFF until a repo sets it with its issue prefix as the value
 *          (`[2, "always", "STA"]`). When on, keyed types need a `Refs: <PREFIX>-n` footer (ADR 0065 rule 4).
 *          Scope is the member's short name (contracts, ir, console, adr, deps, release); a root change uses `repo`.
 * Boundary: rules only; no repo-specific prefix lives here.
 * Runtime: node
 * Governing contract: ADR 0065 (Linear gate checked offline); ADR 0007 (documentation).
 * Owner: release-operations · Secrets: forbidden
 */

/** Commit types that must name an issue. */
export const KEYED_TYPES = ["feat", "fix", "refactor", "perf"];

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

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [{ rules: { "refs-issue-key": refsIssueKey } }],
  rules: {
    "refs-issue-key": [0],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "refactor", "perf", "test", "build", "ci", "chore", "revert"],
    ],
    // Member short names are the scope vocabulary and may carry digits (i18n), which kebab-case rejects.
    "scope-case": [0],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [1, "always", 120],
  },
};
