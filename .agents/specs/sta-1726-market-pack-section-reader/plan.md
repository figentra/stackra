# Plan: a typed market-pack section reader

**Spec**: [spec.md](./spec.md) · **Linear**: STA-1726 · **Tier**: feature

## Approach

1. `ResolvedPackSource` gains a concrete `sectionFor<S extends Schema>(market, section: PackSection<S>, options)` (`PackSection<S>`: a Schema class with
   `static readonly packPrefix: string`):
   resolve once with `resolvePack(await this.packs(), market, options)`; read the field names from
   `schemaOf(section)`'s object shape; for each, `valueOf(resolved, \`${section.packPrefix}.${snakeCase(field)}\`, on)?.value`when defined; return`section.create(values)`.
2. `valueFor` stays as is; both share the `on` default (today, UTC).
3. README: a "Reading a section" paragraph with a billing-shaped example.

## Files

- `packages/foundation/market-packs/src/core/ports/resolved-pack-source.port.ts`
- `packages/foundation/market-packs/src/core/types/pack-section.type.ts` (new)
- `packages/foundation/market-packs/src/core/ports/__tests__/resolved-pack-source.port.test.ts` (new cases)
- `packages/foundation/market-packs/README.md`
- `.changeset/` patch note

## Verification (stackra-f4)

- market-packs unit tests and typecheck
- billing (OS) reads its dunning and rounding defaults through `sectionFor` against a test pack

Tasks: [tasks.md](./tasks.md)
