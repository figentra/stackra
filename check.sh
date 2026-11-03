#!/usr/bin/env bash
pnpm install --frozen-lockfile >/tmp/i.log 2>&1 || { tail -40 /tmp/i.log; exit 1; }
pnpm gen >/tmp/g.log 2>&1 || tail -20 /tmp/g.log
pnpm exec turbo run test --filter=@stackra/tenancy --filter=@stackra/showcase --continue --output-logs=errors-only 2>&1 | grep -vE "^\s*$" | tail -150
