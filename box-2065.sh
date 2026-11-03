#!/usr/bin/env bash
# STA-2065 box job (untracked, never committed): refresh the golden output and print the fixture's expected files.
set -u
pnpm turbo run build --filter=@stackra/gen^... --output-logs=errors-only 2>&1 | tail -2
cd packages/developer/gen
UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts src/core/functions/__tests__/emit-i18n.function.test.ts src/core/functions/__tests__/configured-default.function.test.ts src/core/functions/__tests__/emit-expo-config.function.test.ts > vitest.out 2>&1
echo "vitest exit $?"
grep -aE -A40 "FAIL " vitest.out | head -120
tail -15 vitest.out
cd __golden__
for f in $(find i18n-packages/expected i18n-packages/refusals.json.golden -type f | sort); do
  echo "=== FILE $f"
  cat "$f"
done
echo "=== FILES END"
find . -newer ../package.json -type f -path "*expected*" | sort | sed 's/^/=== CHANGED /'
