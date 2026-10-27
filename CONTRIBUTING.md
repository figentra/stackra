# Contributing

The working rules live in [`AGENTS.md`](AGENTS.md) and `.agents/rules/`; the full guides are in `apps/docs`
(`pnpm docs`). The short version:

1. `mise install`, then `pnpm install`.
2. Track the work in Linear (team `STA`). Branch names come from Linear: `figentra/sta-<n>-<slug>`.
3. Versions come only from `pnpm-workspace.yaml` catalogs or `workspace:*`. Tests sit in `src/**/__tests__/`.
4. Use conventional commits. A `feat`, `fix`, `refactor` or `perf` commit carries `Refs: STA-n`.
5. `pnpm verify` must be green (format, lint, typecheck, test, build, validate, boundaries, knip).
6. Open a pull request using the template. A separate reviewer approves; nobody merges their own change.

## Formatting

One formatter per file type, the same in the editor, the pre-commit hook and CI:

| Tool                     | Owns                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| oxfmt (`.oxfmtrc.jsonc`) | `ts` `tsx` `mts` `cts` `js` `jsx` `mjs` `cjs`, `json` `jsonc` `json5`, `yaml` `yml`, `toml`, `md` `mdx`, `css` `scss` `less`, `html`, `graphql`, `vue` |
| shfmt (`mise.toml` pin)  | `sh`, with options from `.editorconfig` (2 spaces, `switch_case_indent`, `binary_next_line`)                                                           |

- oxfmt formats whole files only: VS Code "Format Selection" is not supported, so save formats the whole file
  (`.vscode/settings.json`). Even Better TOML stays for TOML schemas and validation, not formatting.
- `pnpm format` writes, `pnpm format:check` checks (CI runs it; `pnpm verify` starts with it). lefthook checks
  staged files on commit. `.oxfmtrc.jsonc` ignores generated and vendored paths only; `.specify/**` is skipped
  by both tools as spec-kit upstream content.
- Another file type gets a formatter only when oxfmt cannot format it, and is added to this table.

## Merging

- `Quality Gate` is the only required check, enforced by the `main` ruleset (squash only, linear history, no force
  pushes, merge queue; `.github/rulesets/main.json`). Merges go through `pnpm pr:merge`, which needs an
  `AI-REVIEW: PASS` from the `stackra-reviewer` app (`pnpm bot:review`), never the author, and then enqueues the PR.
  The queue runs the gate on the PR on top of `main` and squash-merges it; a branch need not be up to date first.
  A verdict survives a clean rebase or update-branch while the diff's `git patch-id --verbatim` is unchanged
  ([ADR 0285](apps/docs/src/docs/adr/0285-review-verdict-binds-to-the-patch-id.mdx)); any diff change needs a new review
  ([ADR 0230](apps/docs/src/docs/adr/0230-reviewer-identity-separate-from-builder.mdx),
  [ADR 0119](apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx)). Never `--admin`, never a push to `main`.
- Order (owner decision OP7): the `merge_queue` rule in `.github/rulesets/main.json` is applied only after STA-302
  (a 30-second connect timeout and retries for the bot's GitHub calls) lands. Until then `main` has no queue and
  `pnpm pr:merge` squash-merges directly; it refuses to enqueue while `bot-token.mjs` lacks that support.
- A PR's branch is Linear-named (`figentra/sta-<n>-<slug>`) and its title or branch names the STA key, or it carries
  the `chore-lane` label; `pnpm linear check-pr` enforces it in CI.
- `.github/` changes are CI and permission changes, change risk R3
  ([ADR 0120](apps/docs/src/docs/adr/0120-sdlc-spec-location-lanes-and-change-risk.mdx)).
  `.github/branch-protection.json` and `.github/rulesets/*.json` stay strict JSON (`MUST_STAY_JSON`); a ruleset
  file changes in a PR first, and the owner applies it after merge (`gh api -X PUT repos/<repo>/rulesets/<id>
--input .github/rulesets/main.json`).

Report security issues privately, as described in [`SECURITY.md`](SECURITY.md).
