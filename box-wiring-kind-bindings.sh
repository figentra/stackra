#!/usr/bin/env bash
# Box job (untracked, never committed): STA-2055 wiring kind bindings.
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
git reset -q -- packages/developer/gen/__golden__
echo "=== LOYALTY WIRING BEGIN"
cat packages/commerce/loyalty-kit/.stackra/gen/wiring.ts
echo "=== LOYALTY WIRING END"
for pkg in packages/developer/gen packages/foundation/container packages/commerce/loyalty-kit; do
  (cd "$pkg" && pnpm exec vitest run) > "$ROOT/step-vitest.log" 2>&1
  echo "== vitest $pkg exit $?"
  grep -aE -A15 "FAIL " "$ROOT/step-vitest.log" | head -80
  grep -aE "Test Files|Tests " "$ROOT/step-vitest.log"
done
step format pnpm exec oxfmt --check .
step turbo pnpm turbo run lint typecheck test build --continue --output-logs=errors-only
step lint-root pnpm lint:root
step validate pnpm validate
step boundaries pnpm boundaries
step knip pnpm knip
echo "=== DONE"
