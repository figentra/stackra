#!/usr/bin/env bash
# Untracked, never committed: STA-2072 box job.
set -uo pipefail
rm -rf .boxjob/orig
node --version
echo "== check before"
node .boxjob/regen.mjs check | head -3
echo "== regenerate"
node .boxjob/regen.mjs write | tee .boxjob/regen.log | grep -v '^CHANGED'
grep '^CHANGED' .boxjob/regen.log | cut -d' ' -f2 > .boxjob/changed.txt
pnpm exec oxfmt --write $(cat .boxjob/changed.txt) > /dev/null
echo "== check after"
node .boxjob/regen.mjs check
echo "== unit tests"
(cd packages/developer/cli && pnpm exec vitest run src/node/functions/__tests__/imports-map.function.test.ts src/node/scaffold/functions/__tests__/scaffold.test.ts 2>&1 | tail -25)
echo "== PATCH BEGIN"
for f in $(cat .boxjob/changed.txt); do diff -u --label "a/$f" --label "b/$f" ".boxjob/orig/$f" "$f"; done
echo "== PATCH END"
