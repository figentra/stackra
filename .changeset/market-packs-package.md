---
"@stackra/market-packs": minor
---

Add `@stackra/market-packs`, the market-pack loader: `signPack` and `verifyPack` for signed, content-hashed packs
(SHA-256 of canonical JSON, Ed25519 against trusted keys; a failing pack is refused with `PackRejectedError`),
`resolvePack` for overlays (`eu` then `eu-de`), product sections, per-market pins to a major line or an exact version
and accepted pack statuses, `valueOf` and `valuesOn` for "the value of X for market M on date D" over dated entries,
`floorsOn` for legal floors with their law, `factsOn` as a rules fact source, and `unreviewed` and `launchGate` for
reviewer sign-off and the launch checklist per pack and product. The package holds no pack content.
