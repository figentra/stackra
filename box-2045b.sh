#!/usr/bin/env bash
# STA-2045 re-run (untracked): gen and loyalty-kit suites after the model-first fix.
set -u
pnpm turbo run build --filter=@stackra/gen... --filter=@stackra/loyalty-kit... --output-logs=errors-only 2>&1 | tail -15
for dir in packages/developer/gen packages/commerce/loyalty-kit; do
  echo "=== SUITE $dir"
  (cd "$dir" && pnpm exec vitest run > vitest.out 2>&1; echo "vitest exit $?"; grep -aE -A30 "FAIL " vitest.out | head -60; tail -8 vitest.out)
done
echo "=== DONE"
