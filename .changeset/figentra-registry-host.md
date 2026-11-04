---
"@stackra/cli": minor
"@stackra/licensing": minor
"@stackra/runway": minor
"@stackra/console": minor
---

The registry's default host is `https://registry.figentra.com/`, Figentra Registry (ADR 0453 as amended,
STA-1733): `stackra add`, `create`, `publish` and `doctor` fall back to it when neither `--registry`,
`STACKRA_REGISTRY` nor the workspace `.npmrc` names one, and `stackra new` and the console write it into
`.npmrc`. `@stackra/licensing`'s `registryUrl` defaults to `https://registry.figentra.com`. The runway
schema's example names it. `npm.stackra.figentra.com` stays a permanent alias of the same registry, so a
workspace that pins it keeps working; `stackra doctor` probes both hosts.
