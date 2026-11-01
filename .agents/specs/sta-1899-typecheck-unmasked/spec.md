# Typecheck errors unmasked on main

**Linear**: STA-1899
**Status**: implementing
**Clarifications status**: complete

## Problem

Once `gen:workspace` passed (STA-1884, STA-1890), the Quality Gate's typecheck reached two errors already on main:

- `packages/developer/runway/src/node/functions/preview-serve.function.ts` TS2769: `bodyOf` returns
  `Uint8Array<ArrayBufferLike>`, which `fetch`'s `BodyInit` does not accept.
- `packages/developer/gen/src/core/functions/__tests__/expected-schema.function.test.ts` TS2379: the `relation` helper
  takes `Partial<RelationIR>`, so `{ targetModule: undefined }` is refused under `exactOptionalPropertyTypes`.

## Change

1. `bodyOf` returns `Promise<Uint8Array<ArrayBuffer>>`; its body already builds a fresh `Uint8Array`, so only the type
   changes.
2. The test helper's `extra` accepts `undefined` per field, so the link case keeps clearing the default `targetModule`.

## Acceptance

- The Quality Gate's typecheck passes for `@stackra/runway` and `@stackra/gen`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: @stackra/runway, @stackra/gen (a test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: bug
- **Change risk**: R0
