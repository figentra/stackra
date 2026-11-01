# Plan: typecheck errors unmasked on main (STA-1899)

1. runway: type `bodyOf` as `Promise<Uint8Array<ArrayBuffer>>`.
2. gen test: the `relation` helper's `extra` takes `RelationIR[K] | undefined` per field.
3. oxfmt and oxlint; typecheck runs in CI.
