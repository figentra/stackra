---
"@stackra/fiscal": minor
---

Fiscal certification harness (stackra-31, owner decision D3: certification pending). `./testing` gains
`runCertification` and `certificationCases()`: recorded reference cases per authority built from the published
specifications (ZATCA PIH seed, profile and TLV QR; AEAT Verifactu `Huella` examples 1 and 2, QR URL and namespaces;
DSFinV-K receipt QR; RKSV machine-readable code and start-receipt chain value; ETA e-receipt chain start and share QR),
with the authorities' sandbox endpoints in their pack options, runnable offline or against a sandbox from config (the
`.int` tier reads `STACKRA_FISCAL_SANDBOX`). Fix: ZATCA standard invoices state the supply date (`cac:Delivery`,
BR-KSA-15) from the new optional `FiscalDocument.suppliedAt`, falling back to the issue date.
