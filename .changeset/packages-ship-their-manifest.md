---
"@stackra/brand-kit": patch
"@stackra/gen": patch
---

Packages ship `stackra.manifest.json` in their tarballs (STA-1362). `@stackra/brand-kit` lists it in `files`. The
workspace `.pnpmfile.mjs` beforePacking hook refuses to pack a Stackra package (a `stackra` field of kind `package`,
tier other than `config`) whose manifest is missing or left out of `files`; the manifest is written by
`stackra gen --manifests` and committed, never generated at pack time. The gen README and AGENTS.md say so.
