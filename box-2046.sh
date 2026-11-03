#!/usr/bin/env bash
# STA-2046 box job (untracked, never committed): goldens, gen and queue, then every dependent of @stackra/queue.
set -u
pnpm turbo run build --filter=@stackra/cli... --filter=@stackra/access-log... --output-logs=errors-only 2>&1 | tail -2
node packages/developer/cli/dist/stackra.mjs gen > gen.log 2>&1
echo "workspace gen exit $?"
git status --short -- "*stackra.manifest.json" | head -20
(cd packages/developer/gen && UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -3)
git add -A packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached -- packages/developer/gen/__golden__
echo "=== PATCH END"
for dir in packages/developer/gen packages/runtime/queue; do
  echo "=== SUITE $dir"
  (cd "$dir" && pnpm exec vitest run 2>&1 | grep -aE -A30 "FAIL |Test Files" | head -120)
done
echo "=== DONE"
