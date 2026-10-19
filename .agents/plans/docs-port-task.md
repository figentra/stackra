# Docs Port Task (P0)

**Objective:** Port P0 constitution pages, ADRs, and standards from merged docs-port-inventory

**Source Plan:** `.agents/plans/docs-port-inventory.md` (Section 3)

**Instructions:**

## Constitution (7 pages)

Port these pages adapting content from listed sources (de-brand, Stackra paths):

1. `constitution/index.mdx` - Laws hierarchy + architecture principles
2. `constitution/boundaries.mdx` - Tier direction, placement test
3. `constitution/secrets.mdx` - Two mechanisms (keep articles with checks Stackra runs)
4. `constitution/http-and-events.mdx` - Encore API conventions
5. `constitution/tenancy.mdx` - (P1, defer to Phase 2)
6. `constitution/security.mdx` - (P1, defer to Phase 2)
7. `constitution/delegation.mdx` - (P1, defer to Phase 2)

## ADRs (renumber from 0003)

Port and renumber, then update ALL citations in one sweep:

- 0003: tier-dependency-direction
- 0004: package-archetypes-and-layers
- 0005: di-container-and-legacy-decorators
- 0006: naming-exports-and-imports
- 0007: source-documentation-standard
- 0008: test-placement
- 0009: secrets-two-mechanisms
- 0010: services-are-independent-members (update title from "one-encore-app")
- 0011: rejected-and-deferred-technologies
- 0012: code-host-and-ci

**Critical:** After porting ADRs, run citation sweep:

- Update all `ADR-00XX` references in entire repo
- Fix specific citations: ADR-0007, 0026, 0034, etc. from tooling presets
- Use: `grep -r "ADR-" packages/ tools/ lefthook.yml`

## Standards (9 pages, move from guides)

1. `standards/members.mdx` - Required files per member (merge into existing guides/standards.mdx)
2. `standards/packages.mdx` - Archetypes, layers, exports
3. `standards/services.mdx` - Encore service checklist
4. `standards/apps.mdx` - App types (Vite/Expo/Mintlify) rules
5. `standards/code-style.mdx` - File contract, naming
6. `standards/testing.mdx` - (move from guides/testing.mdx)
7. `standards/dependencies.mdx` - (move from guides/catalogs.mdx)
8. `standards/i18n-rtl.mdx` - (P1)
9. `standards/ui-and-accessibility.mdx` - (P1)

## Guides (new pages)

1. `guides/definition-of-done.mdx` - When a task is complete
2. `guides/scaffolding.mdx` - Using `pnpm new`

## Runbooks (2 P0 pages)

1. `runbooks/secrets.mdx` - Vault layout, mcp.sh, rotation
2. `runbooks/ci.mdx` - The gate, local parity, break-glass

## Agents (2 P0 pages)

1. `agents/concurrent-sessions.mdx` - Worktrees, coordination
2. Rule folder already created (versions.md, workspace-layout.md, secrets.md, etc.)

## Update docs.json

After creating pages, update `apps/docs/src/docs.json` navigation:

- Add Constitution tab with 7 pages
- Update Architecture tab with new ADRs 0003-0012
- Add Standards tab
- Add Runbooks tab
- Add Agents tab
- Keep existing Guides and Writing tabs

**Output:**

- All constitution/standards/guides/runbooks pages in `apps/docs/src/`
- Updated `apps/docs/src/docs.json`
- ADR citation sweep complete

**Validation:**

- `pnpm docs` runs successfully (Mintlify preview)
- `mint validate` passes
- No broken links (`mint broken-links`)
