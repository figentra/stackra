---
title: Concurrent Sessions
always: true
description: Managing multiple concurrent AI agent sessions
---

# Concurrent Sessions

Multiple AI agents can work on Stackra simultaneously with worktrees.

## Preconditions

Before starting concurrent work:

1. **Clean working tree** - Commit or stash all changes
2. **Green CI** - All checks passing on main
3. **Sync dependencies** - `pnpm install`
4. **Understand conflicts** - Agents touching the same files will conflict

## Worktree Strategy

Create a worktree per agent:

```bash
# Main worktree: /Users/akouta/Projects/final-project
git worktree add ../stackra-auth feature/auth

# Agent 1: Authentication in worktree
cd ../stackra-auth
pnpm install
# Agent works here

# Agent 2: UI components in main worktree
cd /Users/akouta/Projects/final-project
# Agent works here

# Merge when done
git worktree remove ../stackra-auth
```

## Coordination Rules

### File Ownership

Each agent claims a file boundary:

- Agent A: `packages/foundation/*`
- Agent B: `packages/security/*`
- Agent C: `services/auth/*`

Never cross boundaries without explicit handoff.

### Shared Files

Some files are shared (read-only for all but one agent):

- `pnpm-workspace.yaml` - Only dependency-steward
- `turbo.jsonc` - Only architecture-guardian
- `.agents/rules/*` - Only one agent at a time

### Communication

Agents must:

1. **Announce intent** - "I'm modifying `packages/foundation/logger`"
2. **Claim files** - Create `.agents/locks/<agent-id>` with file list
3. **Release files** - Delete lock file when done

## Phased Work

Large refactors run in phases:

1. **Phase 1** - Foundation (Agent A)
2. **Phase 2** - Depends on Phase 1 (Agent B)
3. **Phase 3** - Depends on Phase 2 (Agent C)

Never start Phase N+1 until Phase N is merged to main.

## Merge Conflicts

If two agents conflict:

1. **Don't force merge** - Creates tech debt
2. **Coordinate** - One agent rebases, the other waits
3. **Gate check** - `pnpm verify` must pass after merge

## Enforcement

- `guard-paths.mjs` blocks modifications to locked files
- Session context tracks agent boundaries
- Merge checks enforce coordination

## Best Practices

- Prefer small, focused tasks over large refactors
- Test in isolation before merging
- Document the change in the PR description
- Run full gate after merge

## See Also

- Constitution: delegation
- Agents: concurrent-sessions (docs page)
