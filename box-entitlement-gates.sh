#!/usr/bin/env bash
# Box job (untracked, never committed): STA-2059 entitlement gates.
set -u
ROOT=$(pwd)
pnpm turbo run build --filter=@stackra/cli... --output-logs=errors-only > step-cli-build.log 2>&1
echo "== cli-build exit $?"; tail -15 step-cli-build.log
node packages/developer/cli/dist/stackra.mjs gen > step-gen.log 2>&1
echo "== gen exit $?"; tail -20 step-gen.log
(cd packages/developer/gen && UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts) > step-golden.log 2>&1
echo "== golden exit $?"; grep -aE "Test Files|FAIL" step-golden.log | head -20
git add -A packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached -- packages/developer/gen/__golden__
echo "=== PATCH END"
for p in packages/application/actions packages/developer/gen; do
  (cd "$ROOT/$p" && pnpm exec vitest run) > "step-vitest-$(basename $p).log" 2>&1
  echo "== vitest $p exit $?"
  grep -aE -A12 "FAIL " "step-vitest-$(basename $p).log" | head -80
  grep -aE "Test Files|Tests " "step-vitest-$(basename $p).log"
done
step() {
  local name="$1"
  shift
  "$@" > "step-$name.log" 2>&1
  local code=$?
  echo "== $name exit $code"
  if [ "$code" -ne 0 ]; then
    grep -aE "error TS|FAIL |Failed:|ERR_PNPM|error:|Error:|✗|×|warning:|Unused|Unlisted|Unresolved" "step-$name.log" | grep -av "ExperimentalWarning" | head -40
    echo "-- tail"
    tail -25 "step-$name.log"
  fi
}
step format pnpm exec oxfmt --check .
step turbo pnpm turbo run lint typecheck test build --continue --output-logs=errors-only
step lint-root pnpm lint:root
step validate pnpm validate
step boundaries pnpm boundaries
step knip pnpm knip
echo "=== DONE"
