# Feature Specification: @stackra/starter in the fixed group, and `latest` only after a clean-consumer create

**Feature Branch**: `figentra/sta-2874-publish-starter-consumer-smoke`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader

**Linear**: STA-2874

**Clarifications status**: complete

**Input**: `@stackra/starter` returns 404 on the Stackra registry (checked 2026-11-26), so
`npx -y --@stackra:registry=https://npm.stackra.figentra.com/ @stackra/cli create my-app` stops at "Fetching the
starter" unless `--starter` is passed. The template repository's own `starter` job never published it: the registry
trusts only `stackra-inc/stackra` and `stackra-inc/stackra-pro` as `@stackra` publishers, and its version followed the
template's catalog bump, after core's release, not with it. Separately, `latest` moved as soon as a release's
dependency closure held (STA-2778), with nothing proving that a new user's first command works. This change puts the
starter in core's fixed `@stackra/*` group and holds every dist-tag move until a clean consumer has made an app with
`stackra create` from the registry. Split from STA-2778, whose branch this one stacks on (the holding tag
`release-pending` and the dist-tag moves are STA-2778's).

### Sources

- `packages/developer/cli/src/node/commands/create.command.ts` (`readStarter`: `client.tarball("@stackra/starter",
version)`, falling back to `latest`)
- `packages/developer/cli/src/node/create/functions/starter-tarball.function.ts`
- `.github/workflows/runway-npm.yml` (the registry script) and `.github/workflows/release.yml` (its caller)
- `.changeset/config.json` (`fixed: [["@stackra/*"]]`)
- stackra-template `.github/workflows/release.yml` (`starter` job) and `.github/scripts/pack-starter.mjs`
- `workers/registry/src/oidc/match-publisher.ts` (the trusted publisher rows)
- ADR 0515 (reserved on main; written in stackra#1129: decision 3, the starter; Consequences, the release order),
  ADR 0453 (the registry), ADR 0177 (PK5, the fixed group), ADR 0468 (one approval per release)
- The customer guide `/customers/create` (stackra#1129: the documented command and "What your machine needs")

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: starter (new: `packages/developer/starter`, `@stackra/starter`); cli (`starterTarball` reads
  the nested archive); runway (`release.npm.promoteLatestAfter` in the root schema)
- **Public contract change**: a new published package `@stackra/starter` (manifest only: `dist/template.tgz`, no
  entry point); the root runway schema (`tools/schemas/runway-root.schema.json`, `@stackra/runway/schema/root.json`,
  `RELEASE_SECTION_SCHEMA`) gains `release.npm.promoteLatestAfter: "consumer-smoke" | "immediate"`; the reusable
  workflow `runway-npm.yml` gains the inputs `promote-latest-after` (default `consumer-smoke`) and `consumer-smoke`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: the smoke runs downloaded code inside the release job, so it runs under `env -i`: no OIDC
  request token, publish token, App token, CI or GitHub variable reaches it, and its HOME is new and empty. The starter
  build fetches one public commit by id and needs no token
- **Secrets**: none
- **ADR needed**: no new ADR; ADR 0515 decision 3 ("packed from the Stackra template by its release workflow") and its
  Consequences ("then the template's catalog bump, then `@stackra/starter`") must read "packed by core's release from
  the template commit `@stackra/starter` pins, in the fixed group" when stackra#1129 lands (the ADR is not on main yet)
- **New dependencies**: none (the build and the smoke use Node built-ins and git)
- **Deploy modes**: same in all three (release tooling only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: apps/docs/src/docs/runbooks/release.mdx, .github/workflows/README.md,
  packages/developer/starter/README.md and AGENTS.md, packages/developer/runway/README.md and AGENTS.md
- **Lane**: full
- **Change risk**: R2 (release workflow behaviour: `latest` now waits for a smoke that is red until the create path
  works from the registry)

## Contract

**The starter.** `@stackra/starter` is a workspace member in `packages/developer/starter`, so changesets versions it
with every `@stackra/*` release and core's `release.yml` (already the scope's trusted publisher) publishes it. Its
build (`node scripts/build-starter.mjs`) fetches the one commit `package.json` `stackra.template` pins (an https git URL
and a full 40-character id, never a branch), checks the fetched id, refuses a symlink, a submodule, a commit without
`stackra.starter.yaml` and an archive missing a tracked file, and writes every tracked file as `dist/template.tgz`
(entries under `package/`). The archive is nested because `pnpm pack` drops `.npmrc` and drops or applies `.gitignore`
files. The same commit packs to the same bytes. `template:bump [--commit <id>]` moves the pin.

**The CLI.** `starterTarball(tgz)` returns the nested archive's files whole when the package holds
`dist/template.tgz`; a tarball with `template/` (the template's own `pack-starter.mjs`) or neither reads as before.

**The gate.** In `runway-npm.yml`'s registry script, `promote-latest-after` is checked before anything is packed: it
must be `consumer-smoke` (then `consumer-smoke` must be set) or `immediate`. After the final registry closure check and
the move list, if the mode is `consumer-smoke` and some move sets a tag, the script runs the `consumer-smoke` command
from the repository root as
`env -i PATH LANG=C.UTF-8 HOME=<new empty dir> RUNWAY_REGISTRY=<registry> RUNWAY_RELEASE=<name TAB version file>`.
A non-zero exit stops the run with no dist-tag moved (`Consumer smoke failed`); every version stays under
`release-pending`. A re-run runs the smoke again while moves are due; a run with nothing to move runs none. The dry
run names when `latest` would move and runs no smoke.

**The caller.** `release.yml`'s gate reads `runway.yaml` `release.npm.promoteLatestAfter` with yq (`consumer-smoke`
when unset; any other value stops the release) and passes it with `consumer-smoke: node tools/scripts/consumer-smoke.mjs`.
Core's `runway.yaml` sets `consumer-smoke`.

**The smoke.** `tools/scripts/consumer-smoke.mjs` takes the release's `@stackra/cli` and `@stackra/starter` version
(equal in the fixed group), checks the registry serves both at it (so `create` cannot fall back to `latest`'s starter),
refuses a HOME with `.npmrc`, needs node, npx, pnpm, git and a running Docker on PATH and Encore (from PATH, or `mise
install aqua:encoredev/encore@<the starter's mise.toml pin>`), runs
`npx -y --@stackra:registry=<registry> @stackra/cli@<version> create demo --yes` in `$HOME/consumer` with a PATH of
the tool folders, HOME, LANG and a git identity, and then requires the app's `catalogs.stackra` pinned to the version,
`@stackra/cli` installed at it and a first commit.

## Compatibility and migration

- `runway-npm.yml`'s default is `consumer-smoke`, which needs a command: a caller that passes neither input now stops
  before publishing. Core's `release.yml` is the only caller in this repository and passes both; another caller passes
  `promote-latest-after: immediate` to keep the STA-2778 behaviour.
- `@stackra/cli`: additive (a new starter layout read; the old ones still read). Patch changeset.
- `@stackra/runway`: an optional new key. Minor changeset. `@stackra/starter`: new, minor (the fixed group moves
  together).
- The template's own `starter` job becomes redundant: it skips a version already on the registry, so it never
  conflicts; removing it is a template-side cleanup.

## Risks

- The smoke is red until `stackra create` works from the registry end to end (STA-2794 PRs and their template
  counterparts are unmerged, and the pinned template commit stops at gen per the customer guide). Until then `latest`
  stays where it is after a release: this is the intended behaviour, and the runbook names the failure. The owner can
  set `immediate` in `runway.yaml` to release without it.
- The pin is a moving responsibility: a stale template commit can break a new app. The smoke catches it before
  `latest` moves; the fix is `template:bump` and a new release.
- The smoke adds a full create (install, gen, type-check, test) to the release job; the timeout goes from 60 to 90
  minutes.
- `create` still falls back to `latest`'s starter when its own version has none; the smoke checks the version is
  served, so a release never relies on that fallback.

## Acceptance criteria

- **AC-001**: THE workspace SHALL hold a public `@stackra/starter` member, versioned in the `@stackra/*` fixed group,
  whose packed tarball carries `dist/template.tgz` with every tracked file of the pinned template commit, `.npmrc` and
  `.gitignore` files included.
- **AC-002**: IF the pin is not a full commit id or an https git URL, the commit is not served, or the commit holds a
  symlink, a submodule, no `stackra.starter.yaml` or a file `git archive` leaves out, THEN THE build SHALL fail and
  write nothing.
- **AC-003**: WHEN the same commit is built twice THE archives SHALL be byte-identical.
- **AC-004**: WHEN `stackra create` reads a starter holding `dist/template.tgz` THE CLI SHALL return that archive's
  files whole, and SHALL refuse a nested path that climbs out.
- **AC-005**: THE root runway schema SHALL accept `release.npm.promoteLatestAfter` as `consumer-smoke` or `immediate`
  and refuse any other value or key.
- **AC-006**: WHILE `promote-latest-after` is `consumer-smoke` THE registry script SHALL move no dist-tag until the
  `consumer-smoke` command has exited 0 after the last publish and the registry closure check.
- **AC-007**: IF the smoke fails THEN THE run SHALL stop with no dist-tag moved and every version under
  `release-pending`; a re-run SHALL run it again.
- **AC-008**: THE smoke SHALL run with only PATH, LANG, a new empty HOME, RUNWAY_REGISTRY and RUNWAY_RELEASE.
- **AC-009**: IF the mode is `consumer-smoke` with no command, or neither mode, THEN THE run SHALL stop before anything
  is packed or published; WHEN the mode is `immediate` no smoke SHALL run; WHEN nothing is due to move no smoke SHALL
  run; THE dry run SHALL say when `latest` would move and run none.
- **AC-010**: THE core smoke SHALL stop before `create` when the registry does not serve `@stackra/cli` or
  `@stackra/starter` at the release version, SHALL run the documented command at that version with only the tool
  folders, HOME, LANG and a git identity, and SHALL fail on a failed create, an app pinned elsewhere, a missing tool,
  a stopped Docker or a HOME with `.npmrc`.
- **AC-011**: THE release workflow SHALL pass `runway.yaml` `release.npm.promoteLatestAfter` (default
  `consumer-smoke`) and `node tools/scripts/consumer-smoke.mjs` to `runway-npm.yml`, and SHALL stop on any other value.

## Open questions

None for the build. ADR 0515's text (stackra#1129) needs the decision-3 wording above when it lands.

## Status history

- 2026-11-26 → Clarified (STA-2874, split from STA-2778; the audit's 404 re-checked on the registry)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md; built in the same branch)
- 2026-11-26 · Tasked → Implementing · Claude (STA-2874 session) · T001-T006 built and tested on box 2
