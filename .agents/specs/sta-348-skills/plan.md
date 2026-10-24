# Plan: `@stackra/skills`

**Spec**: `.agents/specs/sta-348-skills/spec.md`

## Design

- `.` is isomorphic: `parseAgentDocument(kind, text, source)` splits the frontmatter (`yaml`, duplicate keys refused),
  checks it with the kind's strict zod schema (`FRONT_MATTER_SCHEMAS`, internal), derives the name from the path
  (`documentName`, internal) and returns a frozen document typed for its kind.
- `./node` reads files: `loadSkillSet(root?)` walks `skills/<name>/SKILL.md` and `rules|subagents|commands|hooks/*.md`
  (`KIND_FOLDERS`, internal), skipping `README.md`. The default root is the package's `assets/`, found by walking up to
  the nearest `package.json` (`bundledRoot`, internal), so it holds from `src/` and from `dist/`.
- Errors are a plain `Error` (`AgentDocumentInvalidError`), like `RunwayInvalidError`: a bad document is an author's
  mistake found before anything is written.
- Content: the Stackra-authored open conventions copied from `.agents/` (rules: naming-and-casing, module-boundary,
  http-conventions, not-built-yet, versions, tenancy, service-checklist; skills: the ten v3 authoring skills). Rule
  frontmatter is normalised (`applies_to` to `globs`, `manual` dropped: a rule with neither `always` nor `globs` is on
  request).

## Constitution Check

| Law                                   | Result | Note                                                                                                                                |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/skills`; workspace imports: `@stackra/contracts` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                 |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                               |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                        |
| Tenancy                               | N/A    | no tenant data                                                                                                                      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer              |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                    |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                           |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                   |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                     |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                  |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                             |

- Boundaries: depends on `@stackra/contracts` (`Enum`, `definePackage`), `yaml`, `zod`; no app, service or
  `encore.dev`; `.` has no `node:*` import.
- Versions: catalogs and `workspace:*` only.
- Naming: kind codes snake_case/kebab per ADR 0231; files `<name>.<kind>.ts`.

## Properties

- **P-001**: `loadSkillSet` on the same root returns the same order every time — Validates: FR-003
- **P-002**: Every shipped document parses (the bundled-set test) — Validates: FR-004, FR-005
- **P-003**: `package.json` names `@stackra/skills` at `packages/developer/skills`, `exports` lists `.`, `./node` and `./assets/*` only, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-004**: `.` exports `parseAgentDocument`, `AgentDocumentKind` (`skill`, `rule`, `subagent`, `command`, `hook`), `HookEvent` (`session_start`, `prompt_submit`, `pre_tool_use`, `post_tool_use`), `AgentDocumentInvalidError` and the document and issue types — Validates: FR-002
- **P-005**: `package.json` versions are `catalog:` or `workspace:*` only, and no file in the `.` entry imports `node:*` — Validates: FR-006
- **P-006**: every non-test source file opens with the Stackra file contract and declares one thing with TSDoc on every export, and every test sits in `__tests__/` and imports its runner from `@stackra/testing` — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
