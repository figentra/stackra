# Plan: `@stackra/coding-standard`

**Spec**: `.agents/specs/sta-348-coding-standard/spec.md`

## Design

- One oxlint JS plugin object, `STACKRA_PLUGIN` in `src/core/constants/stackra-plugin.constant.ts`, mapping each
  kebab-case rule name to a rule constant `src/core/constants/<name>-rule.constant.ts`. The `.` export points at the
  plugin file through the `@stackra/source` condition and the tsdown `index` entry until gen writes barrels.
- oxlint exports no AST or rule types, so `src/core/types/` holds the structural subset the rules read (`AstNode`,
  `AstComment`, `RuleContext`, `RuleReport`, `RuleFixer`, `RuleFix`, `RuleMeta`, `Rule`, `Plugin`, `SourceCode`,
  `SourceLocation`, `SourcePosition`). Tests cast a rule to `RuleTester`'s parameter type once per file.
- Shared helpers are pure functions in `src/core/functions/`: `baseName`, `fileKind`, `kebabCase`, `pascalCase`,
  `rootIdentifier`, `bodyOf`.
- The kind table is data: `KIND_BASES` (suffix to allowed bases, from ADR 0294 d16 with 0305 and 0308) and
  `RETIRED_DECORATORS` (retired names that are not kind bases). `no-kind-decorator` refuses the union.
- `base-matches-suffix` is syntactic (root identifier of `extends`); gen's `kind_unregistered_base` resolves imports.
- Autofixes: insert newlines (blank lines), rebuild an options object from property source text (skipped when the
  object holds a comment), collapse a one-line docblock (only when it fits 100 columns). `no-empty-decorator` does
  not fix, because removing `@Auditable()` would change behaviour.

## Constitution Check

| Law                                   | Result | Note                                                                                                                   |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/developer/coding-standard`; no workspace runtime import; no app, service or `encore.dev`       |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                    |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                  |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                           |
| Tenancy                               | N/A    | no tenant data                                                                                                         |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                |

- Boundaries: no workspace import, no `node:*`; dev-only `@stackra/testing`, tooling presets and `oxlint`.
- Versions: catalogs and `workspace:*` only.
- Naming: rule constants SCREAMING_SNAKE (`NO_ENUM_RULE`); rule names kebab-case under the `stackra/` prefix.

## Properties

- **P-001**: Each rule reports nothing on code written in the v3.1 shapes of the template — Validates: FR-003
- **P-002**: Applying an autofix and linting again reports nothing for that rule — Validates: FR-004
- **P-003**: `package.json` names `@stackra/coding-standard` at `packages/developer/coding-standard`, `exports` lists only `.`, and `turbo.jsonc` carries the `tier:lib` tag — Validates: FR-001
- **P-004**: `.` exports `STACKRA_PLUGIN` as a named and as the default export, and its `meta.name` is `stackra` — Validates: FR-002
- **P-005**: `STACKRA_PLUGIN` rules declare no options, and the rule sources import no `node:*` module and read no file system — Validates: FR-005
- **P-006**: `package.json` has no `dependencies` and no `peerDependencies`, and every version in it is `catalog:` or `workspace:*` — Validates: FR-006
- **P-007**: every non-test file under `src/` opens with the Stackra file contract and declares one thing, and every test imports its runner from `@stackra/testing` — Validates: FR-007

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
