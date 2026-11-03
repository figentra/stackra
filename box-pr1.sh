set -euo pipefail
pnpm install --frozen-lockfile >/tmp/install.log 2>&1 || { tail -40 /tmp/install.log; exit 1; }
pnpm turbo run typecheck test lint --filter=@stackra/gen --filter=@stackra/cli --output-logs=errors-only 2>&1 | tail -80
