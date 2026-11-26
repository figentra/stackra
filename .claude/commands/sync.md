---
description: Sync agent definitions (.agents/agents) to .claude/.opencode and report drift
allowed-tools: Bash(pnpm spec:sync), Bash(pnpm exec fflow check)
---

Sync the canonical agent definitions and verify there is no drift:

```bash
pnpm spec:sync
pnpm exec fflow check
```

`pnpm spec:sync` (`fflow sync`) renders `.agents/agents/*.md` (plus tier→model from `.agents/models.yaml`) into the generated copies under `.claude/agents` and `.opencode/agents`. `fflow check` then verifies the generated copies match the sources.

Report the result plainly:

- **No drift**: one line saying sync ran and check is green.
- **Drift or failure**: paste the diff or error output, and name the source file(s) involved. Never edit the generated copies by hand — fix `.agents/agents/*.md` or `.agents/models.yaml` and re-run.
