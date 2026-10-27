<!-- Stackra file contract: Purpose: the agent guide to @stackra/documents. Boundary: this package only. Runtime: docs. Governing contract: ADR 0365; ADR 0356; STA-1365. -->

# AGENTS — @stackra/documents

One print template model, three renderers, signed forms, the PDF engine and assembler ports with their `gotenberg`
drivers, fiscal's `HybridPdf` binding, the e-signature port (ADR 0365), its `connection` driver and the Documenso connector. Member at
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
- The `gotenberg` drivers inject `DocumentsConfig` (key `documents`), never an endpoint object: a constructor takes
  class tokens only (ADR 0294 decision 17). The engine's header is the `DOCUMENTS_GOTENBERG_AUTHORIZATION` secret.
- E-signature: `ConnectionESignatureDriver` routes the port through `ProviderResolver` (capability `e-signature`) and
  prefixes envelope ids `<provider>:<connectionId>:<id>`. Its constructor takes the resolver only; the provider map is
  the overridable `drivers` member (Documenso by default), never a constructor argument (STA-1365). A provider here is an Integration and Connection pair in
  `src/core/drivers/` (`documenso.integration.ts`, `documenso.connection.ts`) whose Connection answers
  `ESignatureConnection`; other vendors are OS integrations (R3-8). JSON calls go through `connection.api`; only
  presigned storage URLs use plain `fetch`, and their failures are `ProviderUnavailableError`.
- The package uses the `decorators` TypeScript and vitest presets for the Connection's `@Secret`.

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

| Data                         | Where                                    | Handling                                                                                             |
| ---------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Render data (names, orders)  | `renderDocument`, `resolveDocument`      | Read by path into the output only; never logged, never put in a refusal (paths only).                |
| Drawn signature, signer name | `signForm`, `SignedForm`                 | Placed in the PDF and returned; the caller stores and audits it. The signature is hashed.            |
| Signer contacts              | `SignatureRequest`, `ESignatureProvider` | Sent only to the provider the scope's Connection names (Documenso: name, email); never in a refusal. |
| Rendered documents, invoices | `PdfEngine`, `PdfAssembler` drivers      | Sent only to the engine at `DocumentsConfig.gotenbergUrl`; never logged or put in a refusal.         |
