---
description: "Tasks for STA-2857: a TypeScript API reference generated from TSDoc, with the package index kept in sync"
---

# Tasks: a TypeScript API reference generated from TSDoc, with the package index kept in sync

**Input**: Design documents from `.agents/specs/sta-2857-api-reference/`

**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: The generator

- [x] T001 Test first: listing, reading, rendering, splitting and the drift check on a throwaway repository in `apps/docs/scripts/api-reference/__tests__/api-reference.test.ts`, `mdx-text.test.ts` and `parse-doc-comment.test.ts` — covers: FR-001, FR-002, FR-003, FR-004, AC-001 — route: tests
- [x] T002 Build the generator in `apps/docs/scripts/api-reference/` (`listPackages`, `ApiReader`, `parseDocComment`, the renderers, `writeApiReference`) — covers: FR-001, FR-002, FR-003, FR-004, AC-001 — route: app — deps: T001

## Phase 2: The pages and the checks

- [x] T003 Generate `apps/docs/src/docs/customers/packages.mdx` and `apps/docs/src/docs/customers/reference/`, list the group in `apps/docs/src/config/docs.config.ts`, keep oxfmt off the pages in `.oxfmtrc.jsonc` — covers: FR-002, AC-003 — route: app — deps: T002
- [x] T004 Run the check in `pnpm validate` in `package.json` — covers: FR-004, AC-001 — route: app — deps: T003
- [x] T005 Test first, then regenerate in the release version step (`changeset:version`) in `package.json`, pinned by `apps/docs/scripts/api-reference/__tests__/release-version-step.test.ts` — covers: FR-005, AC-002 — route: app — deps: T004

## Phase 3: Polish

- [x] T006 Document the generator, the check and the release step in `apps/docs/README.md` and `apps/docs/AGENTS.md` — covers: SC-001, SC-002 — route: steward-docs — deps: T005
- [ ] T007 Run the apps/docs tests, oxlint, oxfmt and `pnpm validate` in `apps/docs/package.json` — covers: SC-001, SC-002, SC-003, AC-001, AC-002, AC-003 — route: verify-fix — deps: T006
