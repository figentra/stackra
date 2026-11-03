#!/usr/bin/env bash
# STA-2058 box job (untracked, never committed): build gen's CLI, workspace gen, golden refresh, gen and navigation suites.
set -u
pnpm install --frozen-lockfile 2>&1 | tail -1
pnpm turbo run build --filter=@stackra/cli... --filter=@stackra/navigation... --output-logs=errors-only 2>&1 | tail -2
node packages/developer/cli/dist/stackra.mjs gen > gen.log 2>&1
echo "workspace gen exit $?"
tail -5 gen.log
echo "=== MANIFESTS changed"
git status --short -- "*stackra.manifest.json" | head -20
for dir in packages/developer/gen packages/experience/navigation; do
  echo "=== TYPECHECK $dir"
  (cd "$dir" && pnpm exec tsc --noEmit 2>&1 | tail -20)
done
(cd packages/developer/gen && UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -5)
git add -A packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached -- packages/developer/gen/__golden__
echo "=== PATCH END"
for dir in packages/developer/gen packages/experience/navigation; do
  echo "=== SUITE $dir"
  (cd "$dir" && pnpm exec vitest run 2>&1 | grep -aE -A30 "FAIL |Test Files" | head -120)
done
echo "=== DONE"
