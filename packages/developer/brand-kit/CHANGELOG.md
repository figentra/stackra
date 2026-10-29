# @stackra/brand-kit

## 0.1.0

### Minor Changes

- ad97946: Add the generic brand generator (stackra-12): `runBrandKit` and the `stackra-brand-kit` binary read
  `assets/brand/kit.json` (with an optional parent kit as data) and write tokens and HeroUI CSS through `@stackra/tokens`,
  app and adaptive icons, splash screens, favicons (`favicon.ico` without an image library), the web manifest and store
  frames with captions from `assets/store`, rendered by resvg with the kit's fonts, plus `asset-manifest.json`.
  `--check` writes nothing: the kit file checklist (README, versions, logos, the parent's endorsement mark, no live
  `<text>` in a logo, the sources each output needs), a determinism rebuild and drift against the output folder.
  `KitInput.theme` is now always the resolved theme and `KitInput` gains `files`.
- 02ceb7e: One `LocalizedText`, in `@stackra/contracts` (a read-only record of strings per BCP 47 tag) (STA-1383). Breaking:
  `@stackra/experience` and `@stackra/brand-kit/contracts` no longer export their copies; import `LocalizedText` from
  `@stackra/contracts`. A brand kit's `name` and `line` are `LocalizedText & { readonly en: string }` (English still
  required).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 8b38906: Packages ship `stackra.manifest.json` in their tarballs (STA-1362). `@stackra/brand-kit` lists it in `files`. The
  workspace `.pnpmfile.mjs` beforePacking hook refuses to pack a Stackra package (a `stackra` field of kind `package`,
  tier other than `config`) whose manifest is missing or left out of `files`; the manifest is written by
  `stackra gen --manifests` and committed, never generated at pack time. The gen README and AGENTS.md say so.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dfa0c6a]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [57f55b7]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [e99b97a]
- Updated dependencies [d44e69c]
- Updated dependencies [5c23791]
- Updated dependencies [12fe727]
- Updated dependencies [d82cd1a]
- Updated dependencies [3a7615d]
- Updated dependencies [3f61d95]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0
  - @stackra/tokens@0.1.0
  - @stackra/support@0.1.0

Written by Changesets on release; never edited by hand.
