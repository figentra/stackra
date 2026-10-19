# `.agents/` — the source of truth for every AI artifact

One canonical tree, projected into each assistant's own directory. Edit here; never edit the
projection.

```
.agents/
├── skills/      invocable skills          → symlinked
├── agents/      subagents, models pinned  → symlinked
├── templates/   skeletons the skills fill → symlinked
├── specs/       work product              → symlinked
├── hooks/       guard/format hooks        → symlinked
└── rules/       always-on invariants      → GENERATED per assistant
```

## Why rules are generated, not symlinked

A symlink gives every assistant identical bytes. That is correct for skills, agents, templates and
specs. It is wrong for rules, because the same prose needs different frontmatter per assistant:

| Assistant   | Path                       | Frontmatter                                                    |
| ----------- | -------------------------- | -------------------------------------------------------------- |
| Claude Code | `.claude/rules/<name>.md`  | none                                                           |
| Kiro        | `.kiro/steering/<name>.md` | `inclusion: always \| fileMatch \| manual`, `fileMatchPattern` |
| Cursor      | `.cursor/rules/<name>.mdc` | `alwaysApply`, `globs`                                         |

So `.agents/rules/*.md` carries **neutral** frontmatter — `always`, `applies_to`, `manual` — and
[`tools/scripts/agents-sync.mjs`](../tools/scripts/agents-sync.mjs) translates it into each
assistant's dialect. Generated files open with a provenance marker; hand-editing one is detected
by `pnpm agents:check` and fails CI rather than being silently overwritten.

## Commands

```bash
pnpm agents:sync                                    # project into every detected assistant
pnpm agents:check                                   # verify; fails on drift (runs in `pnpm verify`)
node tools/scripts/agents-sync.mjs --assistant=kiro  # add an assistant that does not exist yet
node tools/scripts/agents-sync.mjs --list           # show the mapping
```

Assistants are auto-detected by directory existence. Only `.claude/` exists today; `.kiro/` and
`.cursor/` are supported and recreated on demand.

## Writing a rule

Keep it short and **true**. A wrong always-on rule is worse than no rule — it is loaded into every
session and costs tokens to mislead. Verify every claim against a real file before writing it, and
prefer a rule short enough to stay true as the repo changes.
