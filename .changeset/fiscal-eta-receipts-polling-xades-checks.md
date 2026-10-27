---
"@stackra/fiscal": minor
---

Finish the fiscal remainder (stackra-30, ADR 0364 open questions 1 and 2). Egypt's B2C e-receipt is a second ETA driver,
`EtaReceiptDriver` (key `eta-receipt`, `ETA_RECEIPT_OPTIONS`): receipt JSON, UUID over the canonical receipt chained by
`previousUUID`, share-URL QR, submission and polling; `EtaOnboardingDriver` is now keyed `eta-receipt`. Validity polling
is the optional `FiscalDriver.poll` with `FiscalService.pollSubmitted` and `FiscalJournal.submitted`; `EtaDriver.poll`
reads the optional `statusUrl` option. `XadesEnvelopeSignerDriver` builds the ZATCA XAdES envelope over the new host
port `FiscalSigningKey` (`SigningCertificate`, `SignatureRequest.signedAt`, `FiscalSignatureUnsupportedError`,
`FiscalSigningKeyFake`). Guest checks: `FiscalService.sealCheck` with `FiscalCheck`, `FiscalCheckPart` and the
`checkDocument` pack value (`CheckDocumentMode`: `per_part`, `whole_check`) over any till driver.
