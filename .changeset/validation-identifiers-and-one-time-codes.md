---
"@stackra/validation": minor
---

Add identifier checks driven by market-pack data (`IdentifierFormat`, `IdentifierCheck`: Luhn, mod 97, GS1, century and
birth date; `checkIdentifier`, `identifier`, `normalizeIdentifier`) for national IDs, Iqama, Emirates ID, VAT and TRN
numbers and IBANs; `e164`; `countryCode`; `address` with `Address` and `AddressFormat`; GTIN, EAN and UPC check digits
(`gtin`, `isGtin`, `gtinCheckDigit`); and one-time codes (`issueOneTimeCode`, `verifyOneTimeCode`: peppered HMAC,
expiry, attempts, constant-time comparison).
