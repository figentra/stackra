---
"@stackra/fiscal": minor
---

`FiscalTarget` gains an optional `options` field for driver options that are a unit's own rather than the market's. Examples are ETA's `activityCode` (the issuer's registered activity) and Peppol's `accessPointUrl` (the tenant's own provider). The host fills it from its unit and connection.

`FiscalService` merges these options under the pack's options for seal, submit, poll and journal export. The pack wins on a key both hold, so a unit can never redirect a market fact such as `submitUrl`. A field that neither the pack nor the unit holds is still refused with `fiscal_options_invalid`, which names the field.

Market packs carry market facts only.
