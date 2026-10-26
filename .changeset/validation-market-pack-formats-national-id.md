---
"@stackra/validation": minor
---

`AddressFormat` gains `region`, which `address(format)` checks and stores. `AddressFormat$`, `IdentifierFormat$` and
`NationalIdFormats$` parse pack values (`identity.address_format`, `identity.national_ids`, `identity.<name>`) without
casts and export JSON Schema for pack section schemas. `nationalId(formats)` and `NationalId` check an identity document
number against the kinds its market issues; kinds and patterns stay pack data.
