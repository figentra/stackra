# Feature Specification: panel action input modal (ADR 0307 rule 3)

**Created**: 2026-10-30

**Status**: Implementing <!-- builder mode: oxfmt and oxlint run here; the tester runs the rest -->

**Linear**: STA-1627

**Clarifications status**: complete

**Input**: `useResourceActions` sends only the record id, so a record action whose input needs more (moderate, answer,
pause, publish, apply-pack, invite, pin in figentra/commerce#5) is refused by the server. ADR 0307 rule 3 says such a
button opens a modal form.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/experience/panel
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (implements ADR 0307 rule 3 as written)
- **New dependencies**: none (`Modal`, `Form`, `Field.*`, `useSchemaForm` from `@stackra/ui`; `ResourceFormField`)
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Licence tier**: free (`@stackra/panel`)
- **Docs to update**: none (the panel AGENTS.md and the file contracts that said "not built")
- **Change risk**: R1 (console UI only; the server still decides every run)

## Behaviour

1. `actionFormKeys(input, idKey)` (core, pure): the input's top-level keys other than the record id, when at least one
   of them is required (rejects `undefined`); else none. No keys: the button runs with the id as today.
2. With keys, pressing a Row, View, Edit or Bulk button opens `ActionInputModal`: the action's label as title, its
   declared confirm copy as the description, one `ResourceFormField` per key (labels from `resourceLabel`), validated
   by the action's input schema through `useSchemaForm`, the record id pre-filled under the id key.
3. Submit runs the action once per selected id with the same values (bulk: one modal for the whole selection). The
   modal is the confirmation, so the runner skips its own dialog (`{ confirmed: true }`). A refusal keeps the modal
   open with the server's field errors and only the refused ids left; when every id is done the modal closes.
4. Accessibility: React Aria's modal traps focus and returns it; fields carry labels; Enter in a field submits the
   native form; Escape and the Cancel button close it. No physical CSS, so RTL follows the provider.

## Out of scope

- An input with `selection: Selection<...>` (one call for the selection); a native modal; the playground (it has no
  resource pages, so no e2e example).
