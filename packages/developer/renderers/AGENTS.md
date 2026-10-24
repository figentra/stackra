# AGENTS — @stackra/renderers

The renderer layer shared by Stackra and Vellum (ADR 0286 decision 6). Member at `packages/developer/renderers`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294). One entry, `.`.

## Where code goes

| You are writing…        | It goes in…                                    |
| ----------------------- | ---------------------------------------------- |
| An assistant's renderer | `src/core/functions/render-<name>.function.ts` |
| A tool or event map     | `src/core/constants/<name>.constant.ts`        |
| A type                  | `src/core/types/<name>.type.ts`                |
| A test                  | `__tests__/<name>.<kind>.test.ts` beside it    |

## This package

- Pure: no file system, clock or environment read. Output is sorted by path and names documents, never their paths.
- A new assistant is a case in `Assistant`, a `render-<name>.function.ts`, and an entry in the `RENDERERS` map of
  `render-assistant.function.ts`; a document an assistant cannot take is skipped with a reason, never dropped.
- `renderAssistant` is the one public function; the per-assistant renderers stay internal. Add every public file to
  `src/core/index.ts` and to `src/core/__tests__/index.test.ts`.
- The input types come from `@stackra/skills`; a change to them must keep Vellum working (ADR 0286 consequences).

## PII

None. The package renders skill, rule and agent documents into assistant files; it reads and stores no personal data.
