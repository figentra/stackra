#!/usr/bin/env bash
# wp-08 (STA-2069) on ci-box: refresh the gen goldens, run the new unit tests, typecheck gen, tsc over the golden web
# app's class component, then print the changed golden files as a base64 tarball so the Mac can apply them.
set -uo pipefail
ROOT=$(pwd)
pnpm install --frozen-lockfile 2>&1 | tail -3
cd "$ROOT/packages/developer/gen"
echo "=== golden refresh"
UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -15
echo "=== golden compare"
pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -8
echo "=== unit tests"
pnpm exec vitest run src/core/functions/__tests__/emit-ui-facade.function.test.ts src/core/__tests__/index.test.ts 2>&1 | tail -15
echo "=== gen typecheck"
pnpm exec tsc --noEmit -p tsconfig.json 2>&1 | tail -30
echo "=== tsc over the golden web app's class component (AC-005)"
WEB="$ROOT/packages/developer/gen/.cache/golden/app-clients/apps/web"
cat .cache/golden/app-clients/apps/web/.stackra/gen/ui.ts 2>&1
cat > "$WEB/tsconfig.ac005.json" <<'JSON'
{ "extends": "./tsconfig.json", "include": ["src/components"] }
JSON
pnpm exec tsc --noEmit -p "$WEB/tsconfig.ac005.json" --listFiles 2>&1 | grep -v "/typescript/lib/" | tail -20
echo "tsc exit: ${PIPESTATUS[0]}"
rm -f "$WEB/tsconfig.ac005.json"
echo "=== whole golden web app tsc (informational)"
pnpm exec tsc --noEmit -p "$WEB/tsconfig.json" 2>&1 | tail -15
cd "$ROOT"
echo "=== changed"
git status --porcelain --untracked-files=all -- packages/developer/gen/__golden__
CHANGED=$(git status --porcelain --untracked-files=all -- packages/developer/gen/__golden__ | awk '{print $2}' | grep -v "/input/")
echo "=== TAR BEGIN"
tar czf - $CHANGED 2>/dev/null | base64 -w0
echo
echo "=== TAR END"
