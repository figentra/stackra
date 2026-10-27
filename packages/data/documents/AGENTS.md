# AGENTS — @stackra/documents

One print template model, three renderers, signed forms, the PDF engine and assembler ports with their `gotenberg`
drivers, fiscal's `HybridPdf` binding and the e-signature port (ADR 0365). Member at
`packages/data/documents` (`tier:lib`). Entries `.` and `./contracts`.

## Where code goes

| You are writing…                  | It goes in…                                    |
| --------------------------------- | ---------------------------------------------- |
| A port                            | `src/contracts/ports/<name>.port.ts`           |
| A type a port names               | `src/contracts/types/<name>.type.ts`           |
| A driver                          | `src/core/drivers/<name>.driver.ts`            |
| Another port's binding (by shape) | `src/core/bindings/<name>.binding.ts`          |
| A refusal                         | `src/core/errors/<name>.error.ts`              |
| A function                        | `src/core/functions/<name>.function.ts`        |
| A shipped schema                  | `src/core/constants/<name>-schema.constant.ts` |
| A type                            | `src/core/types/<name>.type.ts`                |
| A test                            | `__tests__/<name>.<kind>.test.ts` beside it    |

## Entries and barrels

- `src/core/index.ts` and `src/contracts/index.ts` are stand-in barrels until gen writes them (STA-339); add every
  new public file to the barrel and to the export list in its `__tests__/index.test.ts`.
- `contracts` is the leaf: it never imports `core`. Ports and `SignatureStatus` are exported from `./contracts` only.

## This package

- Configuration, not code (ADR 0363): no country, currency, provider, paper size or wording in source. Those are
  template, market-pack or Connection data. Unicode tables (shaping forms) and a language's grammar are mechanism.
- A new language for amounts in words is a new speller function plus its noun shape in `CURRENCY_WORDS_SCHEMA`.
- A new block kind changes the schema, `resolveDocument`, `renderHtml` and `renderDocx` together.
- HTML output is self-contained: every text escaped, no script, no external URL.
- A new barcode symbology is a new `symbology` value, its encoder function, and the `barcode` case of
  `resolveDocument`; the renderers draw any module row.
- A label kind is a `LABEL_PURPOSE` code plus templates, never a renderer branch.
- `HybridPdfBinding` matches `@stackra/fiscal`'s `HybridPdf` by shape; this package never depends on fiscal.
- The `gotenberg` drivers use plain `fetch`; every failure is `PdfEngineFailedError` (route and status only).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` or `#contracts/*`
  alias.
- No `enum`, no `#private` fields, no parameter properties.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/documents` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data                         | Where                                    | Handling                                                                                           |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Render data (names, orders)  | `renderDocument`, `resolveDocument`      | Read by path into the output only; never logged, never put in a refusal (paths only).              |
| Drawn signature, signer name | `signForm`, `SignedForm`                 | Placed in the PDF and returned; the caller stores and audits it. The signature is hashed.          |
| Signer contacts              | `SignatureRequest`, `ESignatureProvider` | Sent only to the provider the tenant's Connection names; the memory driver keeps it in memory.     |
| Rendered documents, invoices | `PdfEngine`, `PdfAssembler` drivers      | Sent only to the engine at the deployment's `GotenbergEndpoint`; never logged or put in a refusal. |
