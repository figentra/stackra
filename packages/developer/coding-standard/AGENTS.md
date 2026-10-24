# AGENTS — @stackra/coding-standard

The house lint rules as one oxlint JS plugin. Member at `packages/developer/coding-standard` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305).

## Rules

- One entry, `.`, backed by `src/core/`; it exports `STACKRA_PLUGIN` and the same object as the default export,
  because oxlint loads a plugin's default export.
- Zero `dependencies`, zero `peerDependencies`, no workspace import. oxlint does not export its AST types, so
  `src/core/types/` holds the structural subset the rules read; widen `AstNode` when a rule needs a new field.
- A rule is `src/core/constants/<name>-rule.constant.ts` exporting `<NAME>_RULE`, registered in
  `stackra-plugin.constant.ts`, with a `RuleTester` test in `src/core/constants/__tests__/`. A rule's description
  ends with its governing ADR in parentheses.
- Rules take no options. An autofix never drops a comment and never removes code that changes behaviour.
- No `node:*` import and no file system read: rules work from the file name and the syntax tree only.
- One declaration per file (ADR 0305); a file opens with the Stackra file contract and every export carries TSDoc.
- Tests sit in `__tests__/` beside the subject and import the runner from `@stackra/testing` (ADR 0269).

## PII

| Data | Where | Handling                               |
| ---- | ----- | -------------------------------------- |
| None | —     | This package handles no personal data. |
