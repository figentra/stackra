---
"@stackra/fiscal": minor
---

Add `@stackra/fiscal`: e-invoicing and till fiscal drivers behind one `FiscalDriver` port, chosen per market and channel
by market-pack data (ADR 0364). Drivers `zatca` (UBL, chained hash, XAdES, TLV QR, reporting and clearance), `eta`
(item codes, canonical form, CAdES seal), `peppol` (EU and ASP routes), `factur-x` (CII and hybrid PDF), `tse`,
`nf525`, `fdm`, `rt`, `rksv` and `verifactu`; `FiscalService` seals offline on a per-unit chain, submits in order and
exports the journal; `ZatcaOnboarding` issues a CSID per till; ports for the pack, journal, signer, transport, device,
credentials, turnover cipher and hybrid PDF; a memory journal, refusals, option schemas, fakes and fixtures.
