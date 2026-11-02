# Implementation Plan: CI shows every failing typecheck and test task in one run

**Linear**: STA-1937 · **Spec**: `spec.md`

## Steps

1. `.github/workflows/ci.yml`: Typecheck gets `id: typecheck` and runs `pnpm exec turbo run typecheck
--continue=dependencies-successful`; Test runs `pnpm exec turbo run test --continue=dependencies-successful` under
   `if: ${{ !cancelled() && steps.typecheck.outcome != 'skipped' }}`.

## Verification

- zizmor and actionlint in the Quality Gate's workflow lint.
- This PR's own Quality Gate: on today's main, Test lists every failing member (STA-1935's set) in one run.
