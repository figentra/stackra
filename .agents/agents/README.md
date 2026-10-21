# Agents

Canonical agent definitions for Stackra. `pnpm agents:sync` renders them into `.claude/agents` and
`.opencode/agents`; edit the source here, never the generated copies.

Every agent is defined here; no plugin supplies roles to this repository (ADR 0121 D3). The roster is ADR 0258
(roster v2): the package steward is folded into `code-standards-steward` (ADR 0193), `spec-executor` is not ported
(the builders implement spec tasks), and delivery-orchestrator, docs-governance and spec-planner fold into the lead.

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
   assistants: [claude] # optional: only these assistants get it
   ---
   ```

3. Body sections: Mission, Owns, Checks, Never, Hand-offs. Keep it under about 80 lines.
4. A reviewer or guardian gets no `Write`/`Edit`. Only list `Bash` if the body runs commands.
5. Tier to model lives in `models.yaml`; change a model there, not in an agent. OpenCode has rows only for the
   steward and executor tiers, so reviewers, guardians and the lead are never projected there; add
   `assistants: [claude]` to keep an executor or steward off OpenCode too (ADR 0258).
6. Run `node tools/scripts/agents-sync.mjs --lint`, then `pnpm agents:sync`.

## Roster in this folder

| agent                     | tier     | blocks                   | assistants |
| ------------------------- | -------- | ------------------------ | ---------- |
| architecture-guardian     | guardian | yes                      | claude     |
| security-tenancy-reviewer | guardian | yes                      | claude     |
| release-operations        | guardian | yes                      | claude     |
| package-builder           | executor | no                       | both       |
| compiler-engineer         | executor | no                       | claude     |
| service-builder           | executor | no                       | both       |
| data-engineer             | executor | no                       | claude     |
| frontend-builder          | executor | no                       | both       |
| desktop-pwa-builder       | executor | no                       | both       |
| mobile-builder            | executor | no                       | both       |
| infra-engineer            | executor | no                       | claude     |
| test-engineer             | executor | no (the gate blocks)     | both       |
| spec-writer               | executor | no                       | claude     |
| secret-manager            | executor | no                       | claude     |
| code-reviewer             | reviewer | no (verdict gates merge) | claude     |
| api-contract-reviewer     | reviewer | no                       | claude     |
| accessibility-reviewer    | reviewer | no (axe in e2e blocks)   | claude     |
| performance-reviewer      | reviewer | no                       | claude     |
| design-brand-reviewer     | reviewer | no                       | claude     |
| code-standards-steward    | steward  | no                       | both       |
| dependency-steward        | steward  | no                       | both       |
| docs-adr-steward          | steward  | no                       | both       |
| docs-changesets-steward   | steward  | no                       | both       |
| i18n-steward              | steward  | no                       | both       |
| incident-commander        | lead     | no                       | claude     |
