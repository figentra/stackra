# Tasks: `@stackra/documents`

**Input**: `.agents/specs/sta-348-documents/`

- [x] T001 Spec, plan and tasks — covers: SC-001, SC-002 — route: spec-draft
- [x] T002 Member files (`package.json`, `tsconfig.json`, `turbo.jsonc`, `stackra.config.ts`, tool configs, README, AGENTS, LICENSE, CHANGELOG) in `packages/data/documents` — covers: FR-001 — route: package — deps: T001
- [x] T003 Ports, `SignatureStatus` and port types in `src/contracts/` — covers: FR-004, FR-008 — route: package — deps: T002
- [x] T004 Schemas, `PRINT_DOCUMENT_KIND`, `DocumentFormat`, refusals, `parseDocumentTemplate` — covers: FR-002 — route: package — deps: T002
- [x] T005 `resolveDocument` and its helpers; `encodeQr`; `spellAmount` with the Arabic and English spellers — covers: FR-003, FR-006 — route: package — deps: T004
- [x] T006 `renderHtml`, `renderDocx`, `renderDocument`, `contentHashOf`, `verifyContentHash`, `signForm` — covers: FR-004, FR-005, FR-007 — route: package — deps: T005
- [x] T007 `shapeArabic`, `toVisualOrder` — covers: FR-005 — route: package — deps: T002
- [x] T008 `MemoryESignatureDriver` — covers: FR-008 — route: package — deps: T003
- [x] T009 Stand-in barrels and tests beside every subject — covers: SC-001 — route: tests — deps: T008
- [x] T010 Changeset `.changeset/documents-package.md`, ADR 0365 — covers: SC-002 — route: package — deps: T009
- [ ] T011 Add `docx` and `uqr` to a `documents` catalog, `pnpm install`, then tests, typecheck and build in the separate testing workflow — covers: SC-003 — route: tests — deps: T010
