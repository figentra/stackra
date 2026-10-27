/**
 * Stackra file contract:
 * Purpose: the commitlint preset object: conventional commits plus the house type list, subject case and lengths,
 *          and the `refs-issue-key` rule, OFF until a repo sets it with its issue prefix (`[2, "always", "STA"]`).
 * Boundary: rules only; no repo-specific prefix lives here.
 * Runtime: node
 * Governing contract: ADR 0065 (Linear gate checked offline); ADR 0007 (documentation).
 */
import { refsIssueKey } from "../functions/refs-issue-key.function.ts";

/** The shared commitlint configuration. */
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
