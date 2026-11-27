# Implementation Plan: the developer MCP serves Stackra's conventions as resources and its recipes as prompts

**Spec**: `.agents/specs/sta-2919-mcp-resources-prompts/spec.md` · **Linear**: STA-2919 · **Date**: 2026-11-27

**Input**: Feature specification from `.agents/specs/sta-2919-mcp-resources-prompts/spec.md`

## Summary

`serveLocalMcp` answers five more methods. Resources come from a `LocalKnowledge` (root, agent documents, tool names)
built per request: `listLocalResources` lists the guidelines, the manifests and the documents; `readLocalResource`
reads one URI; `guidelinesOf` writes the guidelines Markdown. Prompts are declared in `LOCAL_PROMPTS` (zod objects of
string arguments, listed through `promptArguments`) and filled by `getLocalPrompt`; every recipe and the guidelines
end with `finishSteps`. The skill set is `loadSkillSet()` of `@stackra/skills`, loaded on first use, replaceable by the
new `skills` option. The argument check moves to `argumentsOf`, shared by tools and prompts.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/mcp` (`apps/docs` pages)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); the server tests drive real stdio streams
- **Storage**: none
- **Runtime target**: node (the `./node` entry)

## Key trade-off and research

- **Trade-off: serve the open documents as written** instead of writing a separate guidelines text: one source, so
  the resources never drift from the rendered skills, at the cost of a long guidelines resource (about 44 KB with the
  shipped set). Recipes stay layer 1: they order the open commands and point to the open skills.
- **Research**: the MCP `resources/*` and `prompts/*` methods, `EmbeddedResource` in prompt messages (present since
  2024-11-05), the `-32002` resource-not-found code; `loadSkillSet` and the document types; the kinds `stackra new`
  makes on `main`.

## Applicable standards

| Rule                                                   | How it is enforced                         |
| ------------------------------------------------------ | ------------------------------------------ |
| Tests beside their subjects in `__tests__/` (ADR 0022) | check: the repository layout in CI         |
| Layer 1 only in the local server (ADR 0282 d6, d7)     | review; `packages/developer/mcp/AGENTS.md` |
| Changesets for publishable packages                    | check: changeset status in CI              |
| Versions and catalogs                                  | check: `@stackra/skills` as `workspace:*`  |

## Constitution Check

| Law                                   | Result | Note                                                                          |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `@stackra/mcp` → `@stackra/skills` (same developer tier, no cycle)            |
| Secrets (ADR 0009)                    | PASS   | no secret read                                                                |
| Security                              | PASS   | read-only; URIs matched to prefixes, never joined into paths; output capped   |
| HTTP and events                       | N/A    | no route, header or event changes                                             |
| Tenancy                               | N/A    | local developer tooling, never a tenant tool (ADR 0155)                       |
| Delegation                            | PASS   | one session, one branch                                                       |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                        |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each new file                                |
| Versions and catalogs                 | PASS   | workspace dependency only                                                     |
| Deploy modes (ADR 0076)               | N/A    | developer tooling                                                             |
| Licence tier (ADR 0077)               | PASS   | free                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS.md, two docs pages in both languages, a changeset; ADR 0282 d5 |

## Deploy modes

| Mode       | Behaviour                   |
| ---------- | --------------------------- |
| SaaS       | not deployed; local tooling |
| On-prem    | same                        |
| Air-gapped | same (no network is used)   |

## Correctness properties

- **P-001**: every URI `listLocalResources` answers reads through `readLocalResource` with the same MIME type — Validates: FR-002
- **P-002**: for every prompt and every tool set, the recipe's last numbered steps are the finish steps for that tool set — Validates: FR-006, FR-007
- **P-003**: for every prompt, `promptArguments` marks required exactly the fields that refuse `undefined` — Validates: FR-005
- **P-004**: for every URI outside the served set, `readLocalResource` answers `-32002` naming it — Validates: FR-004
- **P-005**: for every protocol revision a client asks for, `initialize` advertises exactly `tools`, `resources` and `prompts`, and every list method of an advertised capability answers — Validates: FR-001
- **P-006**: for every skill set and every tool set, `guidelinesOf` holds each always-on rule's body with its headings outside fences one level down (no top-level heading under “Always”), lists every other rule and every skill by URI and description, and ends with `finishSteps` of that tool set — Validates: FR-003
- **P-007**: for every prompt, a request with an unknown argument, a missing required argument or a non-string argument, an unknown prompt name and a `code` that is not snake_case each answer `-32602` before a manifest is read — Validates: FR-008

## Architecture overview

`serveLocalMcp` keeps its tool dispatch and adds five cases to its method switch. Each resource or prompt case builds
`LocalKnowledge` (root, documents loaded once, the names of `LOCAL_TOOLS` and the command tools) and calls a pure or
read-only function. Errors are `McpProtocolError`s, which `connectMcp` answers with their code.

## Components and responsibilities

- Constants: `LOCAL_RESOURCE_URI`, `LOCAL_RESOURCE_TEMPLATES`, `LOCAL_PROMPTS`.
- Functions: `listLocalResources`, `readLocalResource`, `guidelinesOf`, `finishSteps`, `getLocalPrompt`,
  `promptArguments`, `argumentsOf`.
- Types: `LocalKnowledge`, `LocalResource`, `ResourceContents`, `PromptMessage`; `ServeLocalMcpOptions.skills`.

## Files and folders

```text
.changeset/
└── mcp-resources-and-prompts.md
apps/docs/src/docs/
├── cli.mdx
├── cli.ar.mdx
├── clients-and-tools.mdx
└── clients-and-tools.ar.mdx
packages/developer/mcp/
├── AGENTS.md
├── README.md
├── package.json
└── src/node/
    ├── constants/
    │   ├── local-prompts.constant.ts
    │   ├── local-resource-templates.constant.ts
    │   └── local-resource-uri.constant.ts
    ├── functions/
    │   ├── arguments-of.function.ts
    │   ├── finish-steps.function.ts
    │   ├── get-local-prompt.function.ts
    │   ├── guidelines-of.function.ts
    │   ├── list-local-resources.function.ts
    │   ├── prompt-arguments.function.ts
    │   ├── read-local-resource.function.ts
    │   ├── serve-local-mcp.function.ts
    │   └── __tests__/
    │       ├── finish-steps.function.test.ts
    │       ├── get-local-prompt.function.test.ts
    │       ├── guidelines-of.function.test.ts
    │       ├── list-local-resources.function.test.ts
    │       ├── read-local-resource.function.test.ts
    │       └── serve-local-mcp.function.test.ts
    └── types/
        ├── local-knowledge.type.ts
        ├── local-resource.type.ts
        ├── prompt-message.type.ts
        ├── resource-contents.type.ts
        └── serve-local-mcp-options.type.ts
pnpm-lock.yaml
```

## Data models and migrations

none

## Contracts

- `ServeLocalMcpOptions.skills?: readonly AgentDocument[]` (`@stackra/mcp/node`).
- MCP methods `resources/list`, `resources/templates/list`, `resources/read`, `prompts/list`, `prompts/get`; the
  resource URIs and prompt names of FR-002 and FR-005.
- Callers: `@stackra/cli`'s `MCP_COMMAND` (unchanged: the default skill set applies).

## Error handling

`-32002` for a URI not served; `-32602` for a missing `uri` or prompt name, an unknown prompt or an invalid argument;
`-32603` for a manifest that is not JSON or a skill set that cannot load. Tools are unaffected by either failure.

## Security and tenancy

Read-only. No command runs from a resource or prompt; nothing is written. A member URI is compared with each
manifest's `member` key and a document URI with each document's `name`, so a URI never becomes a file path. Arguments
are checked by zod first; a member key and a refusal code are restricted to their character sets.

## Testing strategy

- AC-001, AC-002, AC-004: `serve-local-mcp.function.test.ts` ("serves the guidelines, the manifests, the rules and the
  skills as resources"), `list-local-resources.function.test.ts`, `read-local-resource.function.test.ts`.
- P-005 (FR-001): `serve-local-mcp.function.test.ts` ("advertises tools, resources and prompts for every revision, and
  each capability's list method answers"), over `MCP_PROTOCOL_VERSIONS` and an unknown revision.
- AC-003: `guidelines-of.function.test.ts` (fixtures and the shipped set).
- P-006 (FR-003): `guidelines-of.function.test.ts` ("holds every always-on rule nested, lists the rest and ends with
  the finish steps, for every set"), over five skill sets (none, fixtures, the shipped set, its rules, its skills)
  and three tool sets.
- AC-005: `finish-steps.function.test.ts`, `get-local-prompt.function.test.ts` ("ends every recipe…"), the server's
  prompt test with a `test` command tool.
- AC-006, AC-007, AC-008: `get-local-prompt.function.test.ts`, the server's prompt test.
- P-007 (FR-008): `get-local-prompt.function.test.ts` ("refuses every invalid request of every prompt as invalid
  params before reading a manifest"): one manifest is not JSON, so a request that reached the manifests would
  answer `-32603`; a valid control request does.
- Revert check: the server file from `main` makes the four new server tests fail. Per property: advertising
  `tools` only fails P-005; listing always-on rule bodies undemoted fails P-006; reading the manifests before the
  argument check fails P-007.
- Manual: the built `stackra mcp` driven over stdio on box 2.

## Rollout

A minor changeset for `@stackra/mcp`. Agents get the resources and prompts on their next `stackra mcp` start;
`.mcp.json` does not change.

## Delegation and risk plan

One session, one branch. Budget: small (one PR). STA-2873 (in review) replaces `LOCAL_TOOLS` and `readManifests`;
whichever merges second rebases: the tool names for `finishSteps` then come from its tool commands, and the manifest
reads from its reader.

## ADRs

ADR 0282 decisions 5, 6 and 7, ADR 0022 (test placement), ADR 0294 decision 22 (`stackra gen --check`): all Accepted.

## Docs

`packages/developer/mcp/README.md`, `packages/developer/mcp/AGENTS.md`, `apps/docs/src/docs/cli.mdx`,
`apps/docs/src/docs/cli.ar.mdx`, `apps/docs/src/docs/clients-and-tools.mdx`,
`apps/docs/src/docs/clients-and-tools.ar.mdx`, `.changeset/mcp-resources-and-prompts.md`.

## Complexity tracking

none
