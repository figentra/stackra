---
"@stackra/fiscal": minor
---

`CadesSignerDriver`, the `FiscalSigner` for ETA's detached CAdES-BES: a CMS `SignedData` over the request's digest
with the content type, message digest, `ESSCertIDv2` and signing time as signed attributes and the certificate
inside, signed by the host's `FiscalSigningKey` (RSA or EC, as the certificate says), so a token, an HSM or a cloud
e-seal provider signs and the private key never reaches the package. `EtaDriver` now passes the sealing time as
`signedAt`, so ETA's signature carries it.
