# Plan: `@stackra/registry` wave 2

**Spec**: `.agents/specs/sta-348-registry/spec.md`

## Design

- `CatalogueManifest` is a `Schema` class in `src/core/schemas/` that registers this package's hand-written zod schema
  (`CATALOGUE_MANIFEST_SCHEMA` in `src/core/constants/`) for itself, as `CursorInput` does in validation. The schema
  checks the header (`member`, `package`, `version`) and the identity fields of `modules`, `actions`, `events` and
  `permissions`; every object is `loose`, so open fields and other sections pass through. The four sections default
  to `[]`.
- `CatalogueDiagnosticCode` is `Enum.of` with the snake_case codes `manifest_invalid`, `duplicate_member`,
  `identity_collision` (the gen check's name, ADR 0294), `unknown_module`, `foreign_namespace`, `unknown_dependency`
  and `dependency_cycle`.
- `validateCatalogue(manifests)`: parse each with `validate`; sort the valid ones by member, package and input index;
  drop later duplicates of a member; walk modules, actions, events and permissions in that order recording the first
  owner of each identity; check namespaces and module references per member; check dependencies against every
  declared module; find loops with a DFS over sorted keys and report each loop once on its smallest key. Sort the
  result by member, path, code, message with code-unit comparison.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/validation`, `zod` only; no app, service or
  `encore.dev`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; codes snake_case.
- Secrets and PII: none.
- No parameter properties, no `#private` fields, no `enum`.
