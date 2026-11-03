#!/usr/bin/env bash
# wp-25 (STA-2061) on ci-box: build the CLI, generate gen's own .stackra, refresh the gen goldens, run gen's unit tests
# and typecheck, then print every changed golden as a base64 tarball so the Mac can apply it.
set -uo pipefail
ROOT=$(pwd)
CLI="$ROOT/packages/developer/cli/dist/stackra.mjs"
echo "=== build cli"
pnpm turbo run build --filter=@stackra/cli... --output-logs=errors-only 2>&1 | tail -6
cd "$ROOT/packages/developer/gen"
echo "=== gen of gen"
node "$CLI" gen 2>&1 | tail -8
echo "=== golden refresh"
UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -15
echo "=== gen unit tests"
pnpm exec vitest run 2>&1 | grep -E "FAIL|✗|×|AssertionError|Expected|Received|Test Files|Tests |Error" | head -80
echo "=== gen typecheck"
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | tail -30
cd "$ROOT"
echo "=== loyalty-kit and access-log check"
for m in packages/commerce/loyalty-kit packages/security/access-log; do
  (cd "$m" && node "$CLI" gen --check 2>&1 | tail -5)
done
echo "=== changed"
git status --porcelain --untracked-files=all | grep -v "run-wp25.sh"
CHANGED=$(git status --porcelain --untracked-files=all | grep -v "run-wp25.sh" | awk '{print $2}' | grep -E "__golden__")
echo "=== diff stat"
git diff --stat -- $CHANGED | tail -30
echo "=== TAR BEGIN"
tar czf - $CHANGED | base64 -w0
echo
echo "=== TAR END"
