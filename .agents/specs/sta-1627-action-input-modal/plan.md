# Plan: panel action input modal

**Spec**: `.agents/specs/sta-1627-action-input-modal/spec.md`

## Design

- `src/core/functions/action-form-keys.function.ts`: pure detection, shared by web and native.
- `src/react/resource-pages/action-input-modal.tsx` (+ `.props.ts`): `@stackra/ui` `Modal` around a `Form` from
  `useSchemaForm` over the action ref (registered with `registerSchemas`, as `ResourceForm` does), fields drawn by
  `ResourceFormField`.
- `use-resource-actions.ts` becomes `.tsx`: a pressed record or bulk button whose `actionFormKeys` is not empty sets the
  pending run; `ResourceActions.modal` is the open modal, drawn by the list and View pages.
- `ActionRunner` takes an optional `{ confirmed }`, so the modal's submit is the one confirmation.

## Constitution Check

| Law                       | Result | Note                                                         |
| ------------------------- | ------ | ------------------------------------------------------------ |
| Boundaries (ADR 0003)     | PASS   | panel imports only `tier:lib` packages it already depends on |
| Secrets (ADR 0173)        | PASS   | none                                                         |
| Security                  | PASS   | the server decides every run; the modal only collects input  |
| Tenancy                   | N/A    | no data                                                      |
| Not built yet (ADR 0227)  | PASS   | nothing new                                                  |
| Test placement (ADR 0022) | PASS   | `__tests__/` beside each subject                             |
| Versions and catalogs     | PASS   | no dependency change                                         |
