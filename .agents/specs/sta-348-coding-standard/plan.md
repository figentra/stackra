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

## Constitution check

- Boundaries: no workspace import, no `node:*`; dev-only `@stackra/testing`, tooling presets and `oxlint`.
- Versions: catalogs and `workspace:*` only.
- Naming: rule constants SCREAMING_SNAKE (`NO_ENUM_RULE`); rule names kebab-case under the `stackra/` prefix.

## Properties

- **P-001**: Each rule reports nothing on code written in the v3.1 shapes of the template.
- **P-002**: Applying an autofix and linting again reports nothing for that rule.
