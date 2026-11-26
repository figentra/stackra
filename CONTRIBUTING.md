# Contributing

Thank you for helping. Stackra is open to outside contributions: bug reports, documentation fixes
and code. This guide covers what you need as an outside contributor; the extra rules for maintainers
are at the end.

By taking part you agree to follow the [code of conduct](.github/CODE_OF_CONDUCT.md). For questions
and where to get help, read [SUPPORT.md](.github/SUPPORT.md). Report a security problem privately,
as [`SECURITY.md`](SECURITY.md) describes, never in a public issue.

## Before you start

- **Small fixes** (a typo, a broken link, a clearer sentence, a missing test): open a pull request
  directly.
- **Bugs**: open a [bug report](https://github.com/stackra-inc/stackra/issues/new/choose) with the
  package versions and a reproduction.
- **New features and behaviour changes**: open a feature request first and wait for a maintainer to
  agree on the approach. Stackra works from specs and architecture decision records (ADRs, in
  `apps/docs/src/docs/adr`), so a change that skips that step may need rework.

Work is tracked in Linear (team `STA`), which outside contributors cannot see. You do not need an
account. When a maintainer accepts an issue, they reply with its Linear key (`STA-<n>`); use it as
described under [Commits](#commits) and [Pull requests](#pull-requests).

## Set up

You need Git, [mise](https://mise.jdx.dev) and Docker (for services and their databases). Then, in a
fork of this repository:

```bash
mise install          # Node, pnpm and the other pinned tools, from mise.toml
pnpm install --frozen-lockfile --filter='!@figentra/mobile' --filter='!@figentra/playground'
```

- The two filtered members, the mobile app and the playground, use Uniwind Pro, whose install step
  needs a paid licence token. Without one, a plain `pnpm install` stops with a `uniwind-pro`
  postinstall error. The filtered install is exactly what CI runs, and every other member works.
- `pnpm install` also installs the git hooks (lefthook), which format and lint what you commit.
- `pnpm run doctor` checks your machine and says what is missing. It runs the Stackra CLI, so build
  it once first: `pnpm exec turbo run build --filter=@stackra/cli`. (Plain `pnpm doctor` runs pnpm's
  own check instead.) The Xcode and iOS simulator checks matter only for the mobile app.
- No secret, vault or private repository is needed. Contributor steps that mention the sops vault,
  `pnpm linear` or the bot commands are for maintainers. Leave the private `.notes` submodule
  uninitialised.

The repository layout and the rules for each kind of member are in [`AGENTS.md`](AGENTS.md) (it is
written for people and AI agents alike) and in the [documentation](https://docs.stackra.figentra.com)
(`pnpm docs` runs it locally).

## Make the change

- Keep code in the member's `src/`, and put tests next to it in `src/**/__tests__/`. A bug fix comes
  with a test that fails without the fix.
- Dependency versions come only from the catalogs in `pnpm-workspace.yaml` or `workspace:*`; never
  write a version range in a member's `package.json`.
- Run the checks for what you touched, for example:

  ```bash
  pnpm --filter @stackra/<name> test
  pnpm --filter @stackra/<name> typecheck
  pnpm --filter @stackra/<name> lint
  pnpm format:check
  ```

  `pnpm verify` runs the whole gate across the repository. It takes a long time; the maintainers run
  it before a release.

- A change to a published package (`packages/**`) needs a changeset: run `pnpm changeset`, pick the
  package and the bump (patch for a fix, minor for a feature) and write one line a user would
  understand. Commit the file it writes under `.changeset/`.
- Never put a secret value (a key, token or password) in a file, a commit, a test or an issue. Name
  the secret instead.

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org): `type(scope): subject`,
with a header of at most 100 characters and a lower-case subject. The types are `feat`, `fix`,
`docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` and `revert`; the scope is the member's
short name, for example `fix(cli): ...`.

- `docs`, `test`, `chore`, `build` and `ci` commits need nothing more.
- `feat`, `fix`, `refactor` and `perf` commits end with a `Refs: STA-<n>` line naming the Linear key a
  maintainer gave you. CI rejects them without it, so open an issue first for this kind of change.

The commit hook checks the format when you commit.

## Pull requests

1. Push the branch to your fork and open a pull request against `main`. Fill in the template;
   leave the Linear, Spec, Lane and Change risk lines blank if you do not know them.
2. Name the branch after the Linear key when you have one (`figentra/sta-<n>-<short-slug>`), or put
   the key in the title, for example `fix(cli): explain the missing token (STA-123)`. Without a key,
   a maintainer marks the pull request as a small change (the `chore-lane` label) instead.
3. A maintainer approves the CI run for a first-time contributor. The required check is `Quality
Gate`. The `Mobile apps (Uniwind Pro)` job needs the licence token, always fails on a pull request
   from a fork and is not required.
4. A maintainer reviews the change. Answer review comments with new commits; do not force-push
   after review has started. Maintainers squash-merge accepted pull requests, so you never need
   write access.

Your contribution is licensed under the repository's [MIT licence](LICENSE), the same terms as the
code you are changing. The Stackra names and logos are covered by [`TRADEMARKS.md`](TRADEMARKS.md).

## Formatting

One formatter per file type, the same in the editor, the pre-commit hook and CI:

| Tool                     | Owns                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| oxfmt (`.oxfmtrc.jsonc`) | `ts` `tsx` `mts` `cts` `js` `jsx` `mjs` `cjs`, `json` `jsonc` `json5`, `yaml` `yml`, `toml`, `md` `mdx`, `css` `scss` `less`, `html`, `graphql`, `vue` |
| shfmt (`mise.toml` pin)  | `sh`, with options from `.editorconfig` (2 spaces, `switch_case_indent`, `binary_next_line`)                                                           |

- oxfmt formats whole files only: VS Code "Format Selection" is not supported, so save formats the whole file
  (`.vscode/settings.json`). Even Better TOML stays for TOML schemas and validation, not formatting.
- `pnpm format` writes, `pnpm format:check` checks (CI runs it; `pnpm verify` starts with it). lefthook checks
  staged files on commit. `.oxfmtrc.jsonc` ignores generated and vendored paths only; `.flow/**` is skipped
  by both tools as Figentra Flow output.
- Another file type gets a formatter only when oxfmt cannot format it, and is added to this table.

## For maintainers

The working rules live in [`AGENTS.md`](AGENTS.md) and `.agents/rules/`; the flow is in the
[repository guide](docs/repository-guide.md).

1. Track the work in Linear (team `STA`). Branch names come from Linear: `figentra/sta-<n>-<slug>`.
   `pnpm linear start STA-n` moves the issue to In Progress.
2. `pnpm verify` (format, lint, typecheck, test, build, validate, boundaries, knip) runs on the box after the merge;
   merge without waiting and label the issue `needs-testing` (`AGENTS.md`, "Tests run later").
3. A separate reviewer approves; nobody merges their own change.

### Outside pull requests

- Triage each new issue: check its label, and for an accepted bug or feature open a Linear issue and
  reply with its `STA-<n>` key, so the contributor can name it in commits and the pull request.
- On a pull request from a fork, approve the CI run once you have read the diff (workflows from
  first-time contributors wait for that). A pull request without a key gets the `chore-lane` label;
  the label event does not start CI, so re-run the `Quality Gate` job after adding it.
- Fill in the template's Linear, Spec, Lane and Change risk lines yourself, and run the box tests
  (`needs-testing`) the same as for an internal change.

### Merging

- `Quality Gate` is the only required check, enforced by the `main` ruleset (squash only, linear history, no force
  pushes, merge queue; `.github/rulesets/main.json`). Merges go through `pnpm pr:merge`, which needs the owner's
  approval now that the `stackra-reviewer` app is retired (ADR 0523 decision 6), and then enqueues the PR.
  The queue runs the gate on the PR on top of `main` and squash-merges it; a branch need not be up to date first.
  A verdict survives a clean rebase or update-branch while the diff's `git patch-id --verbatim` is unchanged
  ([ADR 0285](apps/docs/src/docs/adr/0285-review-verdict-binds-to-the-patch-id.mdx)); any diff change needs a new review
  ([ADR 0230](apps/docs/src/docs/adr/0230-reviewer-identity-separate-from-builder.mdx),
  [ADR 0119](apps/docs/src/docs/adr/0119-merge-policy-and-release-authority.mdx)). Never a push to `main`; `--admin` only to merge without waiting
  (`AGENTS.md`, "Tests run later").
- Order (owner decision OP7): the `merge_queue` rule in `.github/rulesets/main.json` is applied only after STA-302
  (a 30-second connect timeout and retries for the bot's GitHub calls) lands. Until then `main` has no queue and
  `pnpm pr:merge` squash-merges directly; it refuses to enqueue while `figentra bot token` lacks that support.
- A PR's branch is Linear-named (`figentra/sta-<n>-<slug>`) and its title or branch names the STA key, or it carries
  the `chore-lane` label; `pnpm linear check-pr` enforces it in CI.
- `.github/` changes are CI and permission changes, change risk R3
  ([ADR 0120](apps/docs/src/docs/adr/0120-sdlc-spec-location-lanes-and-change-risk.mdx)).
  `.github/branch-protection.json` and `.github/rulesets/*.json` stay strict JSON (`MUST_STAY_JSON`); a ruleset
  file changes in a PR first, and the owner applies it after merge (`gh api -X PUT repos/<repo>/rulesets/<id>
--input .github/rulesets/main.json`).
