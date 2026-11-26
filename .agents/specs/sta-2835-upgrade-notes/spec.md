# Feature Specification: upgrade notes for the 0.30 to 0.33 minors, and a release-note rule that holds every breaking release to its note

**Feature Branch**: `figentra/sta-2835-upgrade-notes`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: CTO (pending)

**Linear**: STA-2835

**Clarifications status**: complete

**Input**: ADR 0013 decision 5 (carried forward by ADR 0025 decision 5) and `customers/changelog.mdx` promise a release
note written for consumers for each major or breaking release: what changes, pins, human steps, verification and
rollback. None exists: origin/main has no upgrade or migration page, and 0.30.0, 0.32.0, 0.33.0 and 0.33.1 shipped
break-marked changelog entries with no note; 0.33.0 broke the typecheck of every product (STA-2705 facts). Split out of
STA-2705 (readiness batch 8, item 8.2).

### Sources

- ADR 0013 (decisions 4 and 5), ADR 0025 (decision 5), ADR 0091 (rule 4), ADR 0239, ADR 0282 (decision 3)
- every `@stackra/*` `CHANGELOG.md` entry of 0.30.0 to 0.33.1, and the pending `.changeset/*.md`
- the readiness audit, batch 8 item 8.2 (2026-11-26); STA-2705's facts

## Impact

- **Apps touched**: `apps/docs` (six pages under `customers/upgrading/`, the customer changelog, the release runbook,
  ADR 0013 Enforcement, the navigation)
- **Services touched**: none
- **Packages touched**: `@stackra/repo-checks` (rule `release-notes` in the `config` phase)
- **Public contract change**: new `./node` exports of `@stackra/repo-checks` (`releaseNoteFindings`,
  `checkReleaseNotes`, `breakingReleases`, `releaseNotePath`, `RELEASE_BREAK_PATTERN`, `RELEASE_NOTES_FLOOR`,
  `RELEASE_NOTES_FOLDER`, `RELEASE_NOTE_SECTIONS`, types `BreakingRelease` and `ReleaseSource`); `configFindings`
  reports the new rule, so `stackra check` and `stackra validate --repository` run it
- **Cross-service events**: none
- **Tenancy and data**: none (reads changelogs, changesets and docs pages)
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (implements ADR 0013 decision 5; its Enforcement gains the rule)
- **New dependencies**: none
- **Deploy modes**: same in all three (a repository check and documentation)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: the docs site's "For customers" tab gains an "Upgrade" group
- **Docs to update**: `apps/docs/src/docs/customers/upgrading/` (new), `apps/docs/src/docs/customers/changelog.mdx`,
  `apps/docs/src/docs/runbooks/release.mdx`, ADR 0013 Enforcement, `.changeset/README.md`,
  `packages/developer/repo-checks/README.md`, `apps/docs/src/config/docs.config.ts`
- **Lane**: full
- **Change risk**: R2 (a new repository gate in `pnpm validate`)

## Acceptance criteria

- **AC-001**: THE docs site SHALL hold one upgrade note per release line 0.30, 0.31, 0.32 and 0.33 under
  `customers/upgrading/`, each with the sections What changes, Pins, Steps, Verify and Roll back, written from that
  line's changelog entries, AND a note for the pending 0.34 line written from its pending changesets (STA-2797's
  `IdempotencyStore` break), AND an index that lists them and the versions to skip (0.33.0).
- **AC-002**: WHEN a changelog entry of an `@stackra/*` release from 0.30.0 on has a break mark THE rule SHALL report
  that release until its line's note exists (`0-<minor>.mdx` before 1.0.0, `<major>.mdx` after).
- **AC-003**: WHEN a pending changeset that bumps an `@stackra/*` package carries a break mark THE rule SHALL report the
  version the largest pending bump releases until that version's line has its note.
- **AC-004**: WHEN a note lacks one of the five `##` sections THE rule SHALL report each missing section once.
- **AC-005**: WHEN a breaking release is not the first of its line (a breaking patch) THE rule SHALL report it until the
  note names its version.
- **AC-006**: THE rule SHALL report nothing for a note that calls itself "non-breaking", a release before 0.30.0,
  another scope's changelog, a changeset that bumps no `@stackra/*` package, `.changeset/README.md`, or a product
  repository; `stackra validate --repository` SHALL pass on this repository with the notes in place.

## Not in scope

- Sharing one break-mark pattern with `stackra upgrade-notes` (STA-145, PR #1126, unmerged): once both land, its
  `BREAKING_NOTE_PATTERN` can import `RELEASE_BREAK_PATTERN` from `@stackra/repo-checks/node`.
- Deprecating 0.33.0 on the registry: no release workflow can deprecate a version yet (release runbook, Revert); the
  index's "Versions to skip" is the warning until one does.
- Notes for breaks released before 0.30.0.

## Status history

- 2026-11-26 → Clarified (ADR 0013 decision 5; audit item 8.2)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (the commit on `figentra/sta-2835-upgrade-notes`)
- 2026-11-26 → Implementing (review fixes: rebased on STA-2797, whose pending changeset marks a break, so the
  pending 0.34.0 gets `customers/upgrading/0-34.mdx`; AC-002 reworded to EARS)
