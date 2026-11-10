# Feature Specification: an app's i18n catalogue loaders import JSON its bundler can serve

**Feature Branch**: `figentra/sta-2671-app-i18n-json`

**Created**: 2026-11-10

**Status**: Tasked

**Tier**: feature

**Approver**: leader (technical-only stop, under the owner's delegation)

**Linear**: STA-2671

**Clarifications status**: complete

**Input**: STA-2664 item 12 (c), from the OS lane's local run (STA-2670). gen writes each `#stackra/i18n` catalogue
loader as `import("<file>.json", { with: { type: "json" } })`. In an app, Vite turns the JSON into a JavaScript module
(served as `…/en/ui.json?import`), and the browser refuses it: the import attribute asks for a JSON module, the response
is JavaScript ("Expected a JSON module script"). No catalogue loads, so every key shows untranslated.

### Sources

- `packages/developer/gen/src/core/functions/emit-i18n.function.ts` (the loaders)
- `packages/tooling/typescript/src/base.json` (`module` ESNext, `moduleResolution` bundler, `resolveJsonModule`)
- The OS lane's console run on @stackra 0.25.0 (STA-2670)

## Impact

- **Apps touched**: none (their generated `#stackra/i18n` changes on the next gen)
- **Services touched**: none
- **Packages touched**: packages/developer/gen (the i18n emitter and its test)
- **Public contract change**: none; an app's generated loaders lose the import attribute
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: every app's translated text loads again in dev
- **Docs to update**: none
- **Lane**: full
- **Change risk**: R1 (generated import shape for app members only)

## Acceptance criteria

- **AC-001**: WHEN the member is an app THE generator SHALL write each catalogue loader as a plain
  `import("<file>.json")`, with no import attribute.
- **AC-002**: WHEN the member is a service, a package or a Worker THE generator SHALL keep
  `{ with: { type: "json" } }` on each loader.

## Status history

- 2026-11-10 → Clarified (Vite serves the JSON as JavaScript, so the json attribute fails in the browser)
- 2026-11-10 → Planned (plan.md) — Approved by leader 2026-11-10 (STA-2664, first with item 13)
- 2026-11-10 → Tasked (tasks.md; built in the same branch)
