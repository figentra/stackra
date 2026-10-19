/**
 * Stackra file contract:
 * Purpose: conventional-commit enforcement for the lefthook commit-msg hook and CI.
 * Owner: docs-governance
 * Secrets: forbidden
 *
 * Scope is the member's short name (contracts, definition, ir, compiler, runtime, console, adr, deps,
 * release). A commit touching the repo root uses `repo`.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
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
