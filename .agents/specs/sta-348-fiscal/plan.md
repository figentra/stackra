# Plan: `@stackra/fiscal`

**Spec**: `.agents/specs/sta-348-fiscal/spec.md` · **ADR**: 0364 (Proposed)

## Design

- `src/contracts/`: enums (`FiscalChannel`, `FiscalDocumentKind`, `FiscalRecordStatus`, `PartyKind`,
  `SignatureFormat`), the neutral `FiscalDocument` and its parts, the pack shapes (`FiscalMandate`,
  `MarketFiscalSection`), the record and driver I/O types, and the ports `FiscalDriver`, `FiscalPackSource`,
  `FiscalJournal`, `FiscalTransport`, `FiscalSigner`, `FiscalDevice`, `TillCredentials`, `TurnoverCipher`, `HybridPdf`.
- `src/core/services/fiscal.service.ts`: reads the pack on the issue date, picks the driver by key, chains and stores;
  `submitPending`, `offlineStatus`, `exportJournal`. A plain class: drivers are a list picked per call.
- `src/core/drivers/`: the ten mandates plus the memory journal; options schemas in `src/core/constants/`.
- `src/core/functions/`: canonical XML writer, base64/hex, TLV, SHA-256 (Web Crypto), ETA canonical form, tax
  breakdown, zoned time, option and device-answer parsing, export helpers, ZATCA request/outcome.
- `src/testing/`: fakes per port and two fixtures.

## Constitution Check

| Law                    | Result | Note                                                                     |
| ---------------------- | ------ | ------------------------------------------------------------------------ |
| Boundaries             | PASS   | imports `@stackra/{contracts,container,errors,money,validation}` and zod |
| Secrets                | PASS   | no value read; secrets pass from the authority answer to the host store  |
| Configuration not code | PASS   | every market value is a pack option; format identity only in code        |
| Test placement         | PASS   | `src/**/__tests__/`                                                      |
| Versions               | PASS   | `catalog:` and `workspace:*` only                                        |
| Docs and ADRs          | PASS   | README, AGENTS, file contracts; ADR 0364                                 |
