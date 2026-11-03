#!/usr/bin/env bash
# Untracked helper (never committed): regenerate the committed manifests and gen goldens, print the diff as a patch.
set -uo pipefail
pnpm install --frozen-lockfile > /tmp/regen-install.log 2>&1 || { tail -40 /tmp/regen-install.log; exit 1; }
pnpm turbo run //#gen:workspace --output-logs=errors-only > /tmp/regen-gen.log 2>&1
echo "GEN_EXIT=$?"
tail -80 /tmp/regen-gen.log
UPDATE_GOLDEN=1 pnpm --filter @stackra/gen exec vitest run src/node/__tests__/golden.test.ts > /tmp/regen-golden.log 2>&1
echo "GOLDEN_EXIT=$?"
tail -30 /tmp/regen-golden.log
git add -A > /dev/null 2>&1
git diff --cached --stat | tail -60
echo "PATCH_BEGIN"
git diff --cached --binary -- . ':!ci-gen-100-regen.sh' | gzip -9 | base64
echo "PATCH_END"
