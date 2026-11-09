---
"@stackra/market-packs": patch
---

The bundled `ae` pack (0.2.0, still `draft`) authors the UAE's `fiscal.invoice` mandate from 2027-01-01, the first
mandatory group's date: the `peppol` driver with PINT AE's specification identifier `urn:peppol:pint:billing-1@ae-1`
and business process `urn:peppol:bis:billing`, the `Asia/Dubai` time zone, no separate reporting window (the document
is sent through the accredited service provider when it is issued) and a five-year retention. Each business brings its
own ASP, so `accessPointUrl` is the unit's option, never the pack's. It is served only once its reviewers sign it off
and it turns `live`.
