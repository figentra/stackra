# Agent Port Task

**Objective:** Port necessary agent configurations from Figentra to Stackra

**Source:** `/Users/akouta/Projects/.old/old/figentra/.agents/`

**Instructions:**

1. Scan all agents in the source directory
2. Identify which agents are:
   - **Needed for Stackra** (repo-specific, use Stackra package names)
   - **Covered by sdlc plugin** (generic agents like code-reviewer, test-engineer)
   - **Product-specific** (Figentra domain, should NOT port)
   - **Deprecated/unused**
3. For each needed agent:
   - De-brand: Change `@figentra/*` to `@stackra/*`
   - Update ADR citations to match Stackra numbers
   - Update paths: `figentra/` → `stackra/`
   - Test with `pnpm agents:lint` (from agents-sync.mjs)
4. Create a manifest:
   - `.agents/agents/README.md` with agent roster
   - Which agents exist in Stackra
   - Which come from sdlc plugin
   - How to add new agents

5. Port these specific agents (P0/P1):
   - P0: `security-tenancy-reviewer`, `code-standards-steward`
   - P1: `service-builder`, `frontend-builder`, `mobile-builder`, `api-contract-reviewer`, `design-brand-reviewer`, `i18n-steward`

**Output:**

- `.agents/agents/*.md` files (ported agents)
- `.agents/agents/README.md` (roster manifest)
- List of agents NOT to port

**Guidelines:**

- Don't duplicate agents from sdlc plugin
- Remove Figentra-specific vision/tenancy rules (tenancy comes later)
- Ensure tier field is set (steward/executor/reviewer/guardian/lead)
- Keep the agent format simple: name, description, tier, tools, skills

**Validation:**

- After porting, run `pnpm agents:lint`
- Check no name collisions with sdlc agents
