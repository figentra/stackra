# Plan: rename the shadowing boolean (STA-1868)

1. In `fieldOf` (`packages/developer/gen/src/core/functions/emit-schemas.function.ts`), rename `literal` to `isLiteral`.
2. oxlint over every member; the gen tests run in CI. No changeset: no consumer-visible change.
