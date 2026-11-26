---
"@stackra/repo-checks": minor
---

New rule `release-notes` in the `config` phase of `stackra check` and `stackra validate --repository` (ADR 0013
decision 5). An `@stackra/*` release from 0.30.0 on whose changelog entry or pending changeset carries a break mark must
have its release line's upgrade note at `apps/docs/src/docs/customers/upgrading/<line>.mdx` (`0-<minor>.mdx` before
1.0.0), with the sections What changes, Pins, Steps, Verify and Roll back; a patch that carries a mark is named in the
note by its version. A pending mark is held to the version the largest pending bump releases, so the pull request that
adds it and the version pull request both fail without the note.

New exports from `./node`: `releaseNoteFindings`, `checkReleaseNotes`, `breakingReleases`, `releaseNotePath`,
`RELEASE_BREAK_PATTERN` (a note that calls itself "non-breaking" carries no mark), `RELEASE_NOTES_FLOOR`,
`RELEASE_NOTES_FOLDER`, `RELEASE_NOTE_SECTIONS` and the types `BreakingRelease` and `ReleaseSource`. A product
repository has no `@stackra/*` changelog, so the rule reports nothing there.
