# @stackra/fiscal

E-invoicing mandates and till fiscal devices behind one `FiscalDriver` port, chosen per market and channel by
market-pack data. The package holds mechanism only: document formats, hash chains, signing requests, receipt QR codes,
submission and journal export. Which driver a market uses, its endpoints, versions, code mappings, time zone, offline
reporting window and retention period are pack values (ADR 0363, ADR 0364).

**Tier:** `tier:lib` (`packages/commerce/fiscal`). Isomorphic: it runs on a till offline and on a server alike. Keys,
certificates, credentials and the network stay with the host behind ports.

## Entry points

| Import                      | Holds                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@stackra/fiscal`           | `FiscalService`, `ZatcaOnboarding`, the ten drivers, `MemoryFiscalJournalDriver`, refusals, option schemas |
| `@stackra/fiscal/contracts` | the ports, enums and types hosts code against                                                              |
| `@stackra/fiscal/testing`   | port fakes, `fiscalDocument` and `fiscalRecord` fixtures                                                   |

Entry barrels are stand-ins until `stackra gen` writes them (STA-339).

## Drivers

| Key         | Channel          | Mechanism                                                                                               | Ports                                       |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `zatca`     | invoice and till | UBL 2.1, invoice counter and previous-hash chain, XAdES by the unit's CSID, TLV QR, reporting/clearance | signer, transport                           |
| `eta`       | invoice          | document JSON with item codes, canonical serialization, CAdES seal, batch submission                    | signer, transport                           |
| `peppol`    | invoice          | UBL invoice or credit note under the pack's customization (EU BIS, or a PINT through an ASP)            | transport                                   |
| `factur-x`  | invoice          | CII under the pack's profile (Factur-X or ZUGFeRD), hybrid PDF, optional platform                       | transport, `HybridPdf`                      |
| `tse`       | till             | process data signed by the till's TSE, DSFinV-K style receipt QR, TSE archive export                    | `FiscalDevice`                              |
| `nf525`     | till             | software chain: each ticket signs the previous signature, short signature mark                          | signer                                      |
| `fdm`       | till             | fiscal data module signs totals per slot                                                                | `FiscalDevice`                              |
| `rt`        | till             | telematic recorder stores and transmits the document                                                    | `FiscalDevice`                              |
| `rksv`      | till             | machine-readable receipt, encrypted turnover counter, compact JWS chain, DEP export                     | signer, `TurnoverCipher`, `TillCredentials` |
| `verifactu` | till and invoice | record fingerprint chain, verification QR URL, SOAP submission                                          | transport                                   |

## Use

```ts
import { FiscalChannel } from "@stackra/fiscal/contracts";
import {
  FiscalService,
  MarketPackFiscalPackSourceDriver,
  TseDriver,
  ZatcaDriver,
} from "@stackra/fiscal";
import { fetchPacks } from "@stackra/market-packs";

// Production: the fiscal section comes from verified market packs (keys `fiscal.invoice`, `fiscal.till`).
const packs = new MarketPackFiscalPackSourceDriver(await fetchPacks(store, hashes, trustedKeys), {
  pins,
});

const fiscal = new FiscalService(
  [new ZatcaDriver(signer, transport), new TseDriver(device)],
  packs,
  journal,
  clock,
);

const record = await fiscal.seal(document, { market, channel: FiscalChannel.Till, unitId }); // offline, idempotent
await fiscal.submitPending({ market, channel: FiscalChannel.Till, unitId }, 50); // when online, in order
const status = await fiscal.offlineStatus({ market, channel: FiscalChannel.Till, unitId }); // pack window
```

- `seal` reads the pack in force on the issue date; `null` means the market asks nothing in that channel.
- Sealing a document twice on one unit returns the stored record, so a retry never signs twice.
- `submitPending` stops at the first record the authority does not take, keeping order.
- A CSID per till comes from `ZatcaOnboarding` (`compliance`, `check`, `production`), called by device pairing.

## Not here

- Tax computation and document numbering: OS invoicing, pricing and `@stackra/database` sequences.
- Pack loading and verification (`@stackra/market-packs`; this package only binds `FiscalPackSource` over it), device
  pairing (`@stackra/devices`) and PDF rendering (`@stackra/documents`, which binds `HybridPdf`).

## Tasks

`pnpm turbo run <task> --filter=@stackra/fiscal` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.
