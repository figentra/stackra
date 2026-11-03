set -uo pipefail
cp pnpm-lock.yaml /tmp/lock.orig
pnpm install --no-frozen-lockfile >/tmp/install.log 2>&1 || { tail -40 /tmp/install.log; exit 1; }
echo "=== LOCK DIFF BEGIN"; diff -u /tmp/lock.orig pnpm-lock.yaml | sed 's#^--- /tmp/lock.orig#--- a/pnpm-lock.yaml#; s#^+++ pnpm-lock.yaml#+++ b/pnpm-lock.yaml#'; echo "=== LOCK DIFF END"
echo "=== PACKAGES"; pnpm turbo run typecheck test lint --filter=@stackra/gen --filter=@stackra/cli --output-logs=errors-only 2>&1 | tail -25
pnpm turbo run build --filter=@figentra/docs^... --output-logs=errors-only 2>&1 | tail -5
cd apps/docs
echo "=== FUMADOCS BUILD"; time pnpm exec stackra build --target fumadocs 2>&1 | tail -60
echo "=== LINK CHECK"; pnpm exec stackra lint --target fumadocs 2>&1 | grep -v "^wrote " | tail -60
ls .stackra/fumadocs/build/client | head; find .stackra/fumadocs/build/client -name "*.html" | wc -l; du -sh .stackra/fumadocs/build/client
echo "=== MINTLIFY SITE UNCHANGED"; ls .stackra/site | head -5; test -f .stackra/site/docs.json && echo docs.json present; test -f .stackra/site/llms.txt && echo llms.txt present
echo "=== E2E"; (pnpm exec playwright install chromium >/dev/null 2>&1 || true); pnpm exec stackra test --tier e2e 2>&1 | tail -80
cd ../..
echo "=== VALIDATE"; pnpm validate 2>&1 | tail -25
