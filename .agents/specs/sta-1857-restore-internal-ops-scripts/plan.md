# Plan: restore the internal-operations scripts (STA-1857)

1. Restore the 20 files sta-1748 removed from `tools/scripts`, each at its newest pre-removal version: the consolidation
   tree just before sta-1748's merge for most, flow/core-switch `d0143fa9` for agents-sync and its test, sta-1822
   `0c08aa7d` for linear-reconcile, `linear.test.mjs` and the new `linear-reconcile.test.mjs`.
2. Point `prepare` and the aliases in the root `package.json` back at `node tools/scripts/…`.
3. `.github/workflows/ci.yml` `check-pr` runs `node tools/scripts/linear.mjs check-pr`; `linear-sync.yml` is sta-1822's
   node-script version.
4. Update the `tools/scripts` and workflows READMEs. oxfmt and oxlint on the Mac; tests run in CI.
