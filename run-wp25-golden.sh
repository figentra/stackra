#!/usr/bin/env bash
# wp-25 (STA-2061) on ci-box: refresh gen's goldens, then print the golden diff and a base64 tarball of the changed
# golden files so the Mac can apply them. Untracked; never committed.
set -uo pipefail
ROOT=$(pwd)
CLI="$ROOT/packages/developer/cli/dist/stackra.mjs"
echo "=== build cli"
pnpm turbo run build --filter=@stackra/cli... --output-logs=errors-only 2>&1 | tail -6
cd "$ROOT/packages/developer/gen"
echo "=== gen of gen"
node "$CLI" gen 2>&1 | tail -8
echo "=== golden refresh"
UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -25
cd "$ROOT"
echo "=== changed"
git status --porcelain --untracked-files=all -- packages/developer/gen/__golden__
CHANGED=$(git status --porcelain --untracked-files=all -- packages/developer/gen/__golden__ | awk '{print $2}')
echo "=== diff"
git diff -- packages/developer/gen/__golden__ | head -400
if [ -n "$CHANGED" ]; then
  echo "=== TAR BEGIN"
  tar czf - $CHANGED | base64 -w0
  echo
  echo "=== TAR END"
fi
