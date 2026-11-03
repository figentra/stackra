#!/usr/bin/env bash
# Re-run (untracked): build, gen (writes each member's Vitest config), golden check, then the given suites.
set -u
pnpm turbo run build --filter=@stackra/cli... --filter=@stackra/access-log... --output-logs=errors-only 2>&1 | tail -3
node packages/developer/cli/dist/stackra.mjs gen > gen.log 2>&1
echo "workspace gen exit $?"
for dir in "$@"; do
  echo "=== SUITE $dir"
  (cd "$dir" && pnpm exec vitest run > vitest.out 2>&1; echo "vitest exit $?"; grep -aE -A30 "FAIL " vitest.out | head -60; grep -aE "Test Files|Tests " vitest.out; [ -s vitest.out ] && tail -5 vitest.out)
done
echo "=== DONE"
