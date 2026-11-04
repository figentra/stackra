---
"@stackra/runway": minor
---

`targets.cloudflare-workers` members are typed (ADR 0519, STA-1988): a member names a `preset` (`public-site`, `api`,
`internal-tool`, `cache` or `edge`) and may set `compatibilityDate`, `compatibilityFlags`, `workersDev`, `previewUrls`,
`observability`, `limits`, `cache`, `uploadSourceMaps` and `keepVars`; the target takes the same keys under `defaults`.
`workerSettingsOf(target, member)` merges the built-in base, the preset, the defaults and the member, with the target's
`compatibilityDate` as the fallback, and `WorkerPreset` is exported. An unknown preset or Worker key now fails the
provider's parse. Nothing deploys differently yet; the renderer reads these in the next change.
