<!-- Purpose: what @stackra/fiscal is, its entries, drivers, use and limits. Boundary: package docs only; decisions live in ADR 0364. Runtime: docs. Governing contract: ADR 0364; ADR 0294. -->

# @stackra/fiscal

E-invoicing mandates and till fiscal devices behind one `FiscalDriver` port, chosen per market and channel by
market-pack data. The package holds mechanism only: document formats, hash chains, signing requests, receipt QR codes,
submission and journal export. Which driver a market uses, its endpoints, versions, code mappings, time zone, offline
reporting window and retention period are pack values (ADR 0363, ADR 0364).

**Tier:** `tier:lib` (`packages/commerce/fiscal`). Isomorphic: it runs on a till offline and on a server alike. Keys,
certificates, credentials and the network stay with the host behind ports.

## Entry points

| Import                      | Holds                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@stackra/fiscal`           | `FiscalService`, the eleven drivers, the XAdES envelope signer, the onboardings and `FiscalOnboardingService`, the `memory` driver and journal, refusals, option schemas |
| `@stackra/fiscal/contracts` | the ports, enums and types hosts code against                                                                                                                            |
| `@stackra/fiscal/testing`   | port fakes (with `FiscalSigningKeyFake`), `fiscalDocument` and `fiscalRecord` fixtures                                                                                   |

Entry barrels are stand-ins until `stackra gen` writes them (STA-339).

## Drivers

| Key           | Channel          | Mechanism                                                                                                    | Ports                                       |
| ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `zatca`       | invoice and till | UBL 2.1, invoice counter and previous-hash chain, XAdES by the unit's CSID, TLV QR, reporting/clearance      | signer, transport                           |
| `eta`         | invoice          | document JSON with item codes, canonical serialization, CAdES seal, batch submission, validity polling       | signer, transport                           |
| `eta-receipt` | till             | B2C e-receipt JSON, UUID = SHA-256 of the canonical receipt chained by `previousUUID`, share-URL QR, polling | transport, `TillCredentials`                |
| `peppol`      | invoice          | UBL invoice or credit note under the pack's customization (EU BIS, or a PINT through an ASP)                 | transport                                   |
| `factur-x`    | invoice          | CII under the pack's profile (Factur-X or ZUGFeRD), hybrid PDF, optional platform                            | transport, `HybridPdf`                      |
| `tse`         | till             | process data signed by the till's TSE, DSFinV-K style receipt QR, TSE archive export                         | `FiscalDevice`                              |
| `nf525`       | till             | software chain: each ticket signs the previous signature, short signature mark                               | signer                                      |
| `fdm`         | till             | fiscal data module signs totals per slot                                                                     | `FiscalDevice`                              |
| `rt`          | till             | telematic recorder stores and transmits the document                                                         | `FiscalDevice`                              |
| `rksv`        | till             | machine-readable receipt, encrypted turnover counter, compact JWS chain, DEP export                          | signer, `TurnoverCipher`, `TillCredentials` |
| `verifactu`   | till and invoice | record fingerprint chain, verification QR URL, SOAP submission                                               | transport                                   |
| `memory`      | tests and dev    | `MemoryFiscalDriver`: JSON payload chained by SHA-256, every submission accepted and logged, JSON lines      | none                                        |

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

## Validity polling

Authorities that validate after accepting (Egypt's ETA for invoices and e-receipts) leave a record `submitted`. The
driver's optional `poll` asks for the verdict; `FiscalService.pollSubmitted(target, limit)` runs it over the unit's
`submitted` records under the pack sealed with and writes `accepted` or `rejected`, leaving undecided records alone and
stopping at an unreachable authority. Decision (ADR 0364 open question 2): a driver method plus a service call; the
host schedules `pollSubmitted` (a cron or workflow step), so no interval lives in this package. The `eta` driver polls
only when its pack has `statusUrl` (with `{uuid}`); `eta-receipt` always has one.

## Guest checks

`FiscalService.sealCheck(check, target)` seals the documents a check paid in parts issues, under the till mandate's
`checkDocument` pack value: `per_part` (each paid part is its own document with the lines it paid for) or `whole_check`
(one document once the parts' tenders cover the gross; part payments print non-fiscal slips). The till driver the pack
names seals them, so the same call serves a ZATCA simplified invoice, an ETA e-receipt and every EU till driver (TSE,
NF525, FDM, RT, RKSV, Verifactu). Calling it after each payment seals only the new parts. Split arithmetic stays with the
host: a part's lines arrive computed, and a split by amount must be turned into lines first under `per_part`.

## Signing

Drivers ask `FiscalSigner` for a format. For ZATCA's enveloped XAdES the host need not build the envelope: bind
`XadesEnvelopeSignerDriver` over a `FiscalSigningKey` (the unit's private key signs bytes; its certificate's public
facts are read) and the package writes `ext:UBLExtensions` and `cac:Signature`. It makes `xades` only; CAdES (ETA) and
other formats stay with a host signer.

```ts
const zatca = new ZatcaDriver(new XadesEnvelopeSignerDriver(hostKey), transport);
```

## Hybrid PDF

`FacturXDriver.hybrid` embeds the CII XML through the `HybridPdf` port. `@stackra/documents` binds it: its
`HybridPdfBinding` (over the deployment's `PdfAssembler`, Gotenberg by default) matches `HybridPdf` by shape, so the
host passes it straight in (`new FacturXDriver(transport, new HybridPdfBinding(assembler))`) or binds it under
`fiscal.HybridPdf`. This package does not depend on `@stackra/documents`.

## Onboarding

Device pairing registers a till with its mandate's authority through one `FiscalOnboarding` port, picked by the till
mandate's driver key:

```ts
import {
  DeviceOnboardingDriver,
  EtaOnboardingDriver,
  FiscalOnboardingService,
  ZatcaOnboarding,
} from "@stackra/fiscal";

const onboardings = new FiscalOnboardingService([
  new ZatcaOnboarding(transport, credentials),
  new EtaOnboardingDriver(transport, credentials),
  new DeviceOnboardingDriver("tse", device, credentials),
]);

const mandate = (await packs.section(market, now))?.till;
if (mandate && onboardings.supports(mandate.driver)) {
  const onboarding = onboardings.for(mandate.driver);
  onboarding.inputs; // what the pairing screen asks for (`OnboardingInput` codes)
  await onboarding.register(unitId, answers, mandate.options); // stage `compliance`
  await onboarding.complete(unitId, mandate.options); // stage `production`
}
```

| Key                   | Onboarding               | `register`                                                                                                      | `complete`                     |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `zatca`               | `ZatcaOnboarding`        | compliance CSID from the portal OTP and the till's CSR                                                          | production CSID                |
| `eta-receipt`         | `EtaOnboardingDriver`    | the POS's portal client id, secret and pre-shared key, proved by a token request with its serial and OS version | proves them again              |
| `tse`, `fdm`, `rt`, … | `DeviceOnboardingDriver` | `<key>.register` on the paired device: serial and certificate                                                   | `<key>.activate` on the device |

- A step returns only the unit, the stage and the request id; issued values go straight to `TillCredentials`.
- A missing answer is `FiscalOnboardingInputMissingError`, an authority refusal `FiscalOnboardingRefusedError` (nothing
  stored), a key nothing serves `FiscalOnboardingUnsupportedError`.
- `nf525`, `rksv` and `verifactu` have no onboarding here: NF525 and Verifactu register nothing per till, and the RKSV
  FinanzOnline registration is not built yet.
- The `eta-receipt` till options carry `ETA_RECEIPT_OPTIONS` and the onboarding's `tokenUrl` side by side.

## Certification

Not certified against any authority sandbox yet (stackra-31): the ZATCA PIH seed and XAdES digests, the ETA receipt
UUID and QR layout, the DSFinV-K QR, the RKSV layout, the Verifactu fingerprint and the SOAP namespaces are written from
the published specifications.

## Not here

- Tax computation and document numbering: OS invoicing, pricing and `@stackra/database` sequences.
- Pack loading and verification (`@stackra/market-packs`; this package only binds `FiscalPackSource` over it), device
  pairing (`@stackra/devices`) and PDF rendering (`@stackra/documents`, which binds `HybridPdf`).
- Guest-check splitting (Mezzora guest checks) and the scheduling of `pollSubmitted` (the host's cron or workflow).

## Tasks

`pnpm turbo run <task> --filter=@stackra/fiscal` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.
