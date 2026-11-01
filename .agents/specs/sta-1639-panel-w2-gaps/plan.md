# Plan: panel gaps from Commerce · Frontend W2

**Spec**: `.agents/specs/sta-1639-panel-w2-gaps/spec.md`

## Design

- Pure core functions for anything the native pages need too: `actionLabelKey`, `actionFormKeys` (changed),
  `inputKind` (gains `object` and `list`), `fieldCurrency`.
- `ActionInputModal` takes an optional record id key (header actions), a record to prefill from, and bound inputs.
- `ResourceFormField` draws objects, lists (through `useSchemaField` on the list path), enum labels and money.
- `useResourceActions` takes bound inputs; `RelationManager` uses it for its row actions.

## Constitution Check

| Law                       | Result | Note                                                         |
| ------------------------- | ------ | ------------------------------------------------------------ |
| Boundaries (ADR 0003)     | PASS   | panel imports only `tier:lib` packages it already depends on |
| Secrets (ADR 0173)        | PASS   | none                                                         |
| Security                  | PASS   | the server decides every run; forms only collect input       |
| Tenancy                   | N/A    | no data                                                      |
| Not built yet (ADR 0227)  | PASS   | nothing new                                                  |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside each subject                             |
| Versions and catalogs     | PASS   | no dependency change                                         |
