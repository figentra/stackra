---
"@stackra/skills": minor
---

Add `@stackra/skills`, the agent-neutral source of Stackra's open conventions (ADR 0282, 0286): the neutral format
for skills, rules, sub-agents, commands and hooks as Markdown with strict frontmatter, names derived from the path;
`parseAgentDocument`, `AgentDocumentKind`, `HookEvent` and `AgentDocumentInvalidError` in `.`; `loadSkillSet` in
`./node`, which reads the shipped `assets/` set (the naming, boundary, HTTP, versions, tenancy, service and
not-built-yet rules and the v3 authoring skills) or any other root, in a stable order.
