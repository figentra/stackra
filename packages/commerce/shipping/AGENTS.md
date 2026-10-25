# AGENTS — @stackra/shipping

Carrier ports, tracking normalisation, label documents and weight. Member at `packages/commerce/shipping`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `./contracts` and `.`. ADR 0369.

## Where code goes

| You are writing…                 | It goes in…                                 |
| -------------------------------- | ------------------------------------------- |
| An enum (`TrackingState`)        | `src/contracts/enums/<name>.enum.ts`        |
| The port (`CarrierGateways`)     | `src/contracts/ports/<name>.port.ts`        |
| A type or gateway interface      | `src/contracts/types/<name>.type.ts`        |
| A function (`normaliseTracking`) | `src/core/functions/<name>.function.ts`     |
| A refusal (`NoCarrierError`)     | `src/core/errors/<name>.error.ts`           |
| A test                           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/contracts/index.ts` and `src/core/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339);
  add every new public file to one of them and to the export list in that entry's `__tests__/index.test.ts`.
- `contracts` is a leaf; `core` imports it through `#contracts/*`. No symbol is exported from both.

## This package

- Mechanism only (ADR 0363). Never name a carrier, a Market, a dimensional factor, a billing increment, a rate, a
  label stock or a tracking code in source; they are connector data, market-pack data or rule sets.
- No carrier driver here: connectors in OS integrations implement the gateway interfaces on their `Connection`.
- Weights are whole grams and dimensions whole millimetres; bad numeric input is a `RangeError`. A bad carrier label
  is `LabelDocumentInvalidError`.
- Only add a symbol a consumer imports today (the Commerce shipping module, the returns module, the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#contracts/*` or `#core/*`
  alias.
- No TypeScript `enum` (use `Enum.of`), no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no
  `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/shipping` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data                                          | Where                                  | Handling                                                                 |
| --------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Names, phones, emails, addresses, coordinates | `ShippingParty`, `ShippingAddress`     | Passed to the carrier by the connector; never logged or put in an error. |
| Label documents (print the recipient's data)  | `LabelDocument`, `Shipment.labels`     | Bytes are never copied into a refusal; storage is `@stackra/documents`'. |
| Tracking text and places                      | `CarrierEvent.description`, `location` | Carrier text as given; may name a person who signed; not logged here.    |
