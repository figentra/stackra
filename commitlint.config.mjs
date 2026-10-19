/**
 * Stackra file contract:
 * Purpose: conventional-commit enforcement for the lefthook commit-msg hook and CI.
 * Owner: docs-governance
 * Secrets: forbidden
 *
 * Scope is the member's short name (contracts, definition, ir, compiler, runtime, console, adr, deps,
 * release). A commit touching the repo root uses `repo`.
 */
const KEYED = ["feat", "fix", "refactor", "perf"];

export default {
  extends: ["@commitlint/config-conventional"],
  // ADR 0065 rule 4: work commits name their Linear issue in a `Refs: STA-n` footer.
  plugins: [
    {
      rules: {
        "refs-linear-key": ({ type, raw }) => [
          !KEYED.includes(type) || /^Refs:\s*STA-\d+\b/m.test(raw ?? ""),
          `${KEYED.join("/")} commits need a "Refs: STA-n" footer (pnpm linear create, or the branch's issue)`,
        ],
      },
    },
  ],
  rules: {
    "refs-linear-key": [2, "always"],
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
