# Feature Specification: public core carries no private submodule, and the layout check keeps it so

**Feature Branch**: `figentra/sta-2918-remove-notes-submodule`

**Created**: 2026-11-27

**Status**: Implementing

**Tier**: feature

**Approver**: CTO

**Linear**: STA-2918

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: the production-readiness audit of 2026-11-26, batch 23 item 23.5: core's `.gitmodules` declares a submodule
at `.notes` whose URL is a private repository (gitlink `0e5efb8`). The repository answers 404 to an anonymous request, so
`git clone --recursive` of the public core fails for every outside contributor, and `.gitmodules` names a private
repository. AGENTS.md, STATE.md, the repository guide, the workspace-layout rule, the EAS skill and six workflow
comments describe the submodule, and package.json `stackra.layout.allow` declares `.gitmodules` and `.notes`. Nothing
stops a submodule from coming back: the layout check accepts any root entry that `stackra.layout.allow` names.

### Sources

- ADR 0526 (repository layout; decision 4: a root difference is declared in package.json with its reason)
- `packages/developer/repo-checks/src/node/functions/check-repository-layout.function.ts` and
  `layout-findings.function.ts` (the `layout` rule of `stackra validate --repository`)
- `git help gitmodules` (the `.gitmodules` syntax: `[submodule "<name>"]` sections with `path` and `url`)
- core `origin/main` at `b052b6b18`: `.gitmodules`, `git ls-tree origin/main .notes` (a `160000` gitlink)
- Linear STA-2918 (sub-issue of STA-2796); the readiness audit, batch 23 item 23.5

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/repo-checks, packages/developer/flow-preset, packages/developer/cli
- **Public contract change**: additive. `@stackra/repo-checks` exports `checkSubmodules`, `submodulesOf` and the type
  `Submodule`; `layoutFindings` also reports `.gitmodules` findings; package.json `stackra.layout` gains an optional
  `submodules` map (a submodule path and the reason anyone can clone it). `@stackra/flow-preset` drops the `.notes`
  lines from its workspace-layout rule and EAS skill. No existing field changes meaning.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: the public repository no longer names a private repository. A finding never prints the
  user info of a submodule URL (`https://***@host/…`), so a credential pasted into `.gitmodules` is refused without
  being echoed into CI logs.
- **Secrets**: none
- **ADR needed**: no; applies ADR 0526 decision 4 to submodules
- **New dependencies**: none
- **Deploy modes**: none; repository tooling only
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `AGENTS.md` (rendered by `fflow sync` from `flow.config.json`), `STATE.md`,
  `docs/repository-guide.md`, `.agents/rules/workspace-layout.md` and `.agents/skills/mobile-eas-setup/SKILL.md`
  (rendered from `.flow/overrides/` and `packages/developer/flow-preset/preset/`), `packages/developer/repo-checks/README.md`
  (the layout rule), the changeset `.changeset/no-private-submodules.md`
- **Lane**: full
- **Change risk**: R1 (repository tooling; a new `layout` finding only where a repository has a `.gitmodules`)

## Acceptance criteria

- **AC-001**: WHEN core is cloned with `git clone --recursive` and no credentials THE clone SHALL succeed with no submodule fetched.
- **AC-002**: WHEN a repository has no `.gitmodules` THE layout check SHALL report no submodule finding.
- **AC-003**: IF `.gitmodules` declares a submodule whose path `stackra.layout.submodules` does not name with a non-empty reason THEN THE layout check SHALL report one `layout` finding naming the path.
- **AC-004**: IF a declared submodule's URL is ssh, `file://`, a local path, empty or carries user info THEN THE layout check SHALL report one finding.
- **AC-005**: WHEN a declared submodule's URL is https without user info or a relative path THE layout check SHALL report no finding.
- **AC-006**: IF `stackra.layout.submodules` names a path `.gitmodules` does not have THEN THE layout check SHALL report the stale declaration.
- **AC-007**: WHEN a finding names a URL with user info THE finding SHALL print `***` in place of it.
- **AC-008**: WHEN `submodulesOf` reads a `.gitmodules` text THE result SHALL hold each `[submodule "<name>"]` section's path and url in file order, skipping comments and other sections.
- **AC-009**: WHEN the repository docs and agent guides are read THE docs SHALL NOT describe a `.notes` submodule.

## Success Criteria

- **SC-001**: the repo-checks unit tests for AC-002 to AC-008 pass, and each behaviour test fails with its change
  reverted — verified by: unit
- **SC-002**: `stackra validate --repository` on the branch reports no `layout` finding, and on the branch with the old
  `.gitmodules` and allow entries restored reports the `.notes` submodule — verified by: manual (proof in the pull request)
- **SC-003**: an anonymous `git clone --recursive` of the branch succeeds — verified by: manual (proof in the pull request)

## Compatibility and migration

- A repository that runs `stackra validate --repository` and keeps a `.gitmodules` now gets a `layout` finding for each
  submodule until it declares the path in package.json `stackra.layout.submodules` with the reason anyone can clone it
  (or removes the submodule). A declared submodule must use an https or relative URL.
- A checkout that had the `.notes` submodule initialised keeps the folder after pulling (git leaves a populated
  submodule folder in place). The root `.gitignore` ignores `/.notes/` and the format, lint and Python-placement walks
  skip it, so that folder is a plain local checkout of the notes; it can be deleted or moved beside the repository.
- The team reaches the notes through the private notes repository itself, unchanged, cloned next to core rather than
  inside it.

## Out of scope

- Mentions of the private notes repository in ADR sources, runbooks, the Linear repository list and tests (the scrub
  of internal names, STA-2876, owns those files).
- Rewriting history: the old gitlink stays in past commits; it points to a commit of a repository outsiders cannot
  read and carries no content.

## Assumptions

- Outside contributors clone without credentials for private repositories; an https URL to a public host is fetchable.

## Status history

- 2026-11-27 · — → Draft · Stackra readiness lane (Claude) · from the readiness audit, batch 23 item 23.5
- 2026-11-27 · Draft → Implementing · Stackra readiness lane (Claude) · built and proven on the build machine; awaiting the approver's line
