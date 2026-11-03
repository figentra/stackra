#!/usr/bin/env bash
# Box job (untracked, never committed): STA-2056 settings field types.
set -u
ROOT="$(pwd)"
step() {
  local name="$1"
  shift
  "$@" > "$ROOT/step-$name.log" 2>&1
  local code=$?
  echo "== $name exit $code"
  if [ "$code" -ne 0 ]; then
    grep -aE "error TS|FAIL |Failed:|ERR_PNPM|error:|Error:|✗|×|warning:|Unused|Unlisted|Unresolved" "$ROOT/step-$name.log" | grep -av "ExperimentalWarning" | head -40
    echo "-- tail"
    tail -25 "$ROOT/step-$name.log"
  fi
}

step build-cli pnpm turbo run build --filter=@stackra/cli... --output-logs=errors-only
step gen node packages/developer/cli/dist/stackra.mjs gen

(cd packages/developer/gen && UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts) > "$ROOT/step-golden.log" 2>&1
echo "== golden exit $?"
grep -aE "Test Files|Tests " "$ROOT/step-golden.log"
git add -A packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached -- packages/developer/gen/__golden__
echo "=== PATCH END"

for pkg in packages/developer/gen packages/state/settings; do
  (cd "$pkg" && pnpm exec vitest run) > "$ROOT/vitest.log" 2>&1
  code=$?
  echo "== vitest $pkg exit $code"
  if [ "$code" -ne 0 ]; then
    grep -aE -A 25 "FAIL " "$ROOT/vitest.log" | head -150
  fi
  grep -aE "Test Files|Tests " "$ROOT/vitest.log"
done

step format pnpm exec oxfmt --check .
step turbo pnpm turbo run lint typecheck test build --continue --output-logs=errors-only
step lint-root pnpm lint:root
step validate pnpm validate
step boundaries pnpm boundaries
step knip pnpm knip
echo "=== DONE"
