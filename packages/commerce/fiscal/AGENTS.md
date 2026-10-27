<!-- Purpose: how to change @stackra/fiscal: where code goes and the package's rules. Boundary: agent guidance for this member only. Runtime: docs. Governing contract: ADR 0364; ADR 0294; ADR 0305. -->

# AGENTS — @stackra/fiscal

E-invoicing and till fiscal drivers chosen by market-pack data. Member at `packages/commerce/fiscal` (`tier:lib`),
programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./testing`. Decision: ADR 0364.

## Where code goes

| You are writing…                                     | It goes in…                                   |
| ---------------------------------------------------- | --------------------------------------------- |
| A port, an enum or a type hosts code against         | `src/contracts/{ports,enums,types}/`          |
| A driver (one mandate), the memory driver or journal | `src/core/drivers/<key>.driver.ts`            |
| A mandate's till onboarding (`FiscalOnboarding`)     | `src/core/drivers/<key>-onboarding.driver.ts` |
| A driver's pack-option schema or a format constant   | `src/core/constants/`                         |
| A refusal                                            | `src/core/errors/`                            |
| A shared format helper (XML, base64, TLV, time)      | `src/core/functions/`                         |
| A host-side signer built over a narrower host port   | `src/core/drivers/<name>-signer.driver.ts`    |
| The engine or the onboarding registry                | `src/core/services/`                          |
| A fake or fixture                                    | `src/testing/`                                |
| A certification case (one authority's spec values)   | `src/testing/certification-cases.fixture.ts`  |
| A test                                               | `__tests__/<name>.<kind>.test.ts` beside it   |

## This package

- **Configuration, not code.** No country, endpoint, version, rate, slot, payment code, time zone, window or retention
  value lives in code. Each driver reads them from its pack options through its zod schema (`parseOptions`); a field
  missing from the pack is refused, never defaulted. Only format identity (UBL/CII namespaces, UNCL 1001 codes, a
  format's own type letters) is code.
- A new mandate is a new driver with a key and an options schema; the pack names the key. Never branch on a market.
- Drivers never read the clock, a secret or the network themselves: time comes in `SealContext.now`, keys stay behind
  `FiscalSigner`/`TurnoverCipher`, credentials behind `FiscalTransport`/`TillCredentials`, hardware behind
  `FiscalDevice`.
- `seal` must work offline. Submission is separate and runs in sequence order; a transport failure is
  `FiscalAuthorityUnavailableError` and leaves the record sealed.
- A till registration is a `FiscalOnboarding` driver keyed like its `FiscalDriver`: it lists its `inputs`, stores
  issued values only through `TillCredentials` and returns only `OnboardingStep`. `ZatcaOnboardingDriver` lives in
  `drivers/zatca-onboarding.driver.ts` and keeps its published name.
- `MemoryFiscalDriver` (key `memory`) is for tests and development only: it signs nothing and reaches no authority,
  so no market pack names it. It reads no options.
- `renderXml` output is hashed by chained formats: never change its canonical form.
- ETA has two drivers: `eta` (invoices, CAdES-sealed, invoice channel) and `eta-receipt` (B2C e-receipts, unsigned,
  UUID chain per POS, till channel). `EtaOnboardingDriver` is keyed `eta-receipt` because only the POS registers.
- Validity polling is the optional `FiscalDriver.poll` plus `FiscalService.pollSubmitted`; implement `poll` only for an
  authority that validates after accepting, and return `null` while it has not decided. Scheduling is the host's.
- `FiscalService.sealCheck` turns a guest check into documents with `checkDocuments` under the till mandate's
  `checkDocument` pack value; it never prorates amounts, and a pack without the value is refused.
- `XadesEnvelopeSignerDriver` builds the ZATCA XAdES envelope over the host's `FiscalSigningKey`; the signing time comes
  in `SignatureRequest.signedAt` (the driver passes `SealContext.now`), never from a clock.
- `HybridPdf` is bound by `@stackra/documents` (`HybridPdfBinding`, by shape); never add a dependency on documents here.
- Certification is pending for every driver (owner decision D3). A change to a driver's format keeps its case in
  `certificationCases()` passing; a value a case asserts comes from the published specification named in its
  `source`, never from the driver's own output. A fix forced by a sandbox run lands with a case that pins it, and the
  README's Certification section records it.
- `FiscalDocument.suppliedAt` is optional; ZATCA prints it on a standard invoice and falls back to the issue date.
- Every new public file goes in its barrel and that entry's `index.test.ts`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- No `#private` fields or parameter properties (`erasableSyntaxOnly`).
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data                                     | Where                                  | Handling                                                                                    |
| ---------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Buyer name and tax number                | `FiscalRecord.payload`                 | Required by law on the fiscal document; kept for the pack's retention period, never logged. |
| Issued CSID token and secret             | `TillCredentials` (host store)         | Passed straight to the host store, which encrypts them; never returned, logged or exported. |
| ETA POS client secret and pre-shared key | `TillCredential.secret`, `.attributes` | Same: host store encrypts; the access token proving them is dropped.                        |
| Refusal details                          | errors                                 | Keys, fields and statuses only.                                                             |
