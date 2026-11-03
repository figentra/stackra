set -e
pnpm install --frozen-lockfile >/dev/null 2>&1 || pnpm install >/dev/null 2>&1
pnpm --filter @stackra/gen exec vitest run src/core/functions/__tests__ src/node/functions/__tests__/compile-migrations.function.test.ts 2>&1 | tail -60
pnpm --filter @stackra/gen typecheck 2>&1 | tail -20
