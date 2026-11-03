#!/usr/bin/env bash
# STA-2045 box job (untracked, never committed): goldens, gen, iam and loyalty-kit, then every dependent of @stackra/iam.
set -u
pnpm turbo run build --filter=@stackra/cli... --filter=@stackra/access-log... --output-logs=errors-only 2>&1 | tail -2
node packages/developer/cli/dist/stackra.mjs gen > gen.log 2>&1
echo "workspace gen exit $?"
git status --short -- "*stackra.manifest.json" | head -20
python3 -c "import json,glob; [print(f, len(json.load(open(f)).get(\"policies\", []))) for f in glob.glob(\"packages/*/*/stackra.manifest.json\") + glob.glob(\"services/*/stackra.manifest.json\") if json.load(open(f)).get(\"policies\")]"
echo "=== MANIFESTS BEGIN"
for f in $(grep -l '"policies"' packages/*/*/stackra.manifest.json services/*/stackra.manifest.json 2>/dev/null); do git diff -- "$f"; done
echo "=== MANIFESTS END"
(cd packages/developer/gen && UPDATE_GOLDEN=1 pnpm exec vitest run src/node/__tests__/golden.test.ts 2>&1 | tail -3)
git add -A packages/developer/gen/__golden__
echo "=== PATCH BEGIN"
git diff --cached -- packages/developer/gen/__golden__
echo "=== PATCH END"
for dir in packages/developer/gen packages/security/iam packages/commerce/loyalty-kit; do
  echo "=== SUITE $dir"
  (cd "$dir" && pnpm exec vitest run 2>&1 | grep -aE -A30 "FAIL |Test Files" | head -120)
done
echo "=== DEPENDENTS"
pnpm turbo run test --filter="...^@stackra/iam" --continue --output-logs=errors-only > dependents.log 2>&1
echo "dependents exit $?"
grep -aE "FAIL |Failed:|Tasks: " dependents.log | head -60
echo "=== DONE"
