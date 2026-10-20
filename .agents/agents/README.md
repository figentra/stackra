# Agents

Canonical agent definitions for Stackra. `pnpm agents:sync` renders them into `.claude/agents` and
`.opencode/agents`; edit the source here, never the generated copies.

Every agent is defined here; no plugin supplies roles to this repository (ADR 0121 D3). Eight roles are being
ported here under MIT (ADR 0121 D9): architecture-guardian, code-reviewer, test-engineer, release-operations,
package-steward, dependency-steward, accessibility-reviewer, spec-executor. Keep those names free for the ports.
delivery-orchestrator, docs-governance, spec-author and spec-planner fold into the lead session and existing roles.

## Working model

The main session coordinates and writes nothing substantial. All work is delegated to subagents with an
explicit tier. Builders (executor) implement from a brief, reviewers and guardians report, stewards sweep.

## Add an agent

1. Create `.agents/agents/<name>.md`; the file stem equals `name`.
2. Neutral frontmatter, no model ids:

   ```yaml
   ---
   name: <kebab-case, equals file stem>
   description: <what it does>. Use when <trigger>.
   tier: steward | executor | reviewer | guardian | lead
   blocks: true | false # true = its FAIL stops the merge
   tools: [Read, Grep, Glob, Bash]
   ---
   ```

3. Body sections: Mission, Owns, Checks, Never, Hand-offs. Keep it under about 80 lines.
4. A reviewer or guardian gets no `Write`/`Edit`. Only list `Bash` if the body runs commands.
5. Tier to model lives in `models.jsonc`; change a model there, not in an agent.
6. Run `pnpm agents:lint`, then `pnpm agents:sync`.

## Roster in this folder

| agent                     | tier     | blocks |
| ------------------------- | -------- | ------ |
| security-tenancy-reviewer | guardian | yes    |
| code-standards-steward    | steward  | no     |
| service-builder           | executor | no     |
| frontend-builder          | executor | no     |
| mobile-builder            | executor | no     |
| api-contract-reviewer     | reviewer | no     |
| design-brand-reviewer     | reviewer | no     |
| i18n-steward              | steward  | no     |
