# @stackra/skills

The agent-neutral source of Stackra's open conventions (ADR 0282, layer 1): every skill and rule is written once as
Markdown with frontmatter, and the renderers (`@stackra/renderers`, ADR 0286) write it into each assistant's own layout:
Claude Code, OpenCode, Kiro, Cursor and `AGENTS.md`. `stackra agents setup` installs the result at the user level, so
a project commits no agent tree.

**Tier:** `tier:lib` (`packages/developer/skills`). Entries `.` and `./node`, plus the asset path `./assets/*` (the
documents themselves). Depends on `@stackra/contracts`, zod and yaml.

## What is here

| Entry      | Symbol                                                                  | Use                                                      |
| ---------- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| `.`        | `parseAgentDocument(kind, text, source)`                                | check one document and get it typed for its kind         |
| `.`        | `AgentDocumentKind`, `HookEvent`                                        | enums                                                    |
| `.`        | `AgentDocumentInvalidError`                                             | error naming the file and every invalid path             |
| `.`        | `AgentDocument`, `SkillDocument`, `RuleDocument`, `SubagentDocument`, … | types                                                    |
| `./node`   | `loadSkillSet(root?)`                                                   | every document under a root; defaults to the shipped set |
| `./assets` | `skills/<name>/SKILL.md`, `rules/<name>.md`                             | the documents, for tools that read files directly        |

## The format

One folder per kind under a root. A document's name is derived from its path and must be kebab-case; a frontmatter
`name`, if written, must match it. Every frontmatter schema is strict: a misspelled key fails.

| Kind       | Where                    | Frontmatter                                                   |
| ---------- | ------------------------ | ------------------------------------------------------------- |
| `skill`    | `skills/<name>/SKILL.md` | `description`                                                 |
| `rule`     | `rules/<name>.md`        | `title`, `description`, `always` (false), `globs` ([])        |
| `subagent` | `subagents/<name>.md`    | `description`, `tools` ([])                                   |
| `command`  | `commands/<name>.md`     | `description`, `argumentHint`                                 |
| `hook`     | `hooks/<name>.md`        | `description`, `event` (a `HookEvent` code), `matcher`, `run` |

A rule with `always: true` loads into every session; one with `globs` loads when a matching file is touched; one with
neither is read on request. A folder's `README.md` is documentation and is skipped. Files beside a `SKILL.md` are the
skill's supporting files; renderers copy the folder.

```ts
import { loadSkillSet } from "@stackra/skills/node";

const alwaysOn = loadSkillSet().filter((document) => document.kind === "rule" && document.always);
```

## What is not here

Layer 2 (generators, reviewer checklists, orchestration, fix playbooks) is served by the hosted MCP after sign-in and
never ships in this package (ADR 0282 decision 7). Figentra-internal operations (Linear, bot identities, the merge
gate, the secrets inbox, delegation, the spend meter) stay in the Stackra repository (decision 4); a test fails if the
shipped set mentions them.
