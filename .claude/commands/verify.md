---
description: Run the repo gate (pnpm verify) and report failures plainly
allowed-tools: Bash(pnpm verify), Bash(pnpm validate), Bash(pnpm turbo:*)
---

Run the full repository gate:

```bash
pnpm verify
```

This runs format, lint, typecheck, test, build, validate, boundaries and knip (see `apps/docs/src/docs/runbooks/ci.mdx` for what each step catches).

Report the result plainly:

- **Green**: one line saying so.
- **Red**: name the failing step(s), paste the first relevant error block for each, and stop. Do not fix anything; the user decides what happens next.
