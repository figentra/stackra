# Implementation Plan: the registry accepts contract and docs items

**Linear**: STA-1905 · **Spec**: `spec.md`

## Steps

1. `src/constants/stackra-kinds.constant.ts`: add `contract` and `docs`; the catalogue filter and `StackraKind` read it.
2. `src/constants/suffix-kinds.constant.ts`: `SUFFIX_KINDS`, the kinds named with a `-<kind>` suffix.
3. `src/publish/check-publish.ts`: a suffix kind needs `-<kind>` at the end of the bare name; the others keep the
   prefix rule.
4. Tests: `check-publish.test.ts` (both kinds pass with the suffix and are refused with the prefix; a suffixed skill
   is still refused); `handle-request.test.ts` (the catalogue filters by both).
5. README: the naming rule names the suffix kinds.

## Verification

On the testbed: `tsc --noEmit` and `vitest run` in `workers/registry` (19 files, 173 tests). Then the owner runs
Deploy registry.
