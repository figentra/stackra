---
"@stackra/coding-standard": patch
"@stackra/oxlint-config": minor
---

Turn on every `stackra/*` house rule at error in the oxlint base preset, loading `@stackra/coding-standard` from its
source file (ADR 0421), and add kebab-case file names, the retired `@Injectable`/`@Inject`/`define*` import ban,
cross-service bans and the package entry direction (contracts, core, node/react/native, testing) to the presets.
`consistent-type-imports` is no longer turned off for packages and apps in `boundaries.jsonc`.
