---
"@stackra/registry": minor
---

Edition records (ADR 0335, stackra-64): `EditionBundle` takes optional `packs` and `rolePresets` record keys, and
`checkEditionBundle` refuses a bundle whose base has no release in range (`base_unknown`), that bundles a module the
base does not declare (`bundled_module_unknown`) or whose own module takes a base key (`module_key_taken`).
