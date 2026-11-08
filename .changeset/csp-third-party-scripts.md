---
"@stackra/csp": minor
---

`CspConfig.thirdPartyScripts` is the per-surface third-party script allowlist: each exact https origin with the
consent category that gates it. A `necessary` script (a payment SDK) always loads; any other (an ad pixel under
`marketing`) is added to `script-src` only when `CspAdditions.consent` grants its category, so without consent only
`necessary` scripts load and an unlisted script never does. Wildcards, paths and http are refused at boot.
