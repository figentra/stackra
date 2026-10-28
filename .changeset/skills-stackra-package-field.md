---
"@stackra/skills": minor
"@stackra/cli": patch
---

Breaking rename for unique public names (STA-1383): the `stackra` field type of a registry item's `package.json` in
`@stackra/skills/contracts` is `StackraPackageField`, so `StackraManifest` is only `@stackra/contracts`' type of a
member's committed `stackra.manifest.json`. `STACKRA_MANIFEST_SCHEMA` keeps its name.
