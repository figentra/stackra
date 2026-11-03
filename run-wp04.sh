set -e
pnpm install --frozen-lockfile
UPDATE_GOLDEN=1 pnpm --filter @stackra/gen exec vitest run src/node/__tests__/golden.test.ts -t identity-changed
pnpm --filter @stackra/gen test
pnpm --filter @stackra/validation test
pnpm --filter @stackra/gen typecheck
git status --short
