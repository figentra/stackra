#!/usr/bin/env bash
# Box job (untracked, never committed): STA-2062 gen, golden, package tests and every step of pnpm verify.
set -u
pnpm install --frozen-lockfile > step-install.log 2>&1
echo "== install exit $?"
pnpm turbo run build --filter=@stackra/cli... --output-logs=errors-only > step-build-cli.log 2>&1
echo "== build-cli exit $?"
tail -25 step-build-cli.log
node packages/developer/cli/dist/stackra.mjs gen > step-gen.log 2>&1
echo "== gen exit $?"
tail -25 step-gen.log
(cd packages/developer/gen && UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts) > step-golden.log 2>&1
echo "== golden exit $?"
grep -aE "Test Files|Tests " step-golden.log
git add -A packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached -- packages/developer/gen/__golden__
echo "=== PATCH END"
git reset -q -- packages/developer/gen/__golden__

(cd packages/developer/gen && pnpm exec vitest run) > step-gen-tests.log 2>&1
echo "== gen-tests exit $?"
awk '/FAIL /{p=1;n=0} p{print; n++; if(n>30){p=0}}' step-gen-tests.log | head -200
grep -aE "Test Files|Tests " step-gen-tests.log

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
