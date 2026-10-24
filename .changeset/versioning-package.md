---
"@stackra/versioning": minor
---

Add `@stackra/versioning`, dated API versions and versioned integration events (ADR 0118, 0141, 0305): the
`Change<Subject>({ from, sunset })` kind base in its event form (`from: 1`, with `up` and `down`) and its dated response
form (`from: "2027-03-01"`, with `down` only), `registerChanges`, `downgrade` and `upgrade`, which convert straight from
and to the subject's current shape, `resolveVersion`, which picks the `Stackra-Version` header, the caller's pin or the
fallback and adds the `Deprecation` and `Sunset` headers, `VERSIONING_HEADERS`, and the `UnsupportedVersionError` and
`VersionSunsetError` refusals.
