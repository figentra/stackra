---
"@stackra/achievements": patch
"@stackra/ai": patch
"@stackra/app": patch
"@stackra/fiscal": patch
"@stackra/gen": patch
"@stackra/infra-aws-runtime": patch
"@stackra/infra-cloudflare": patch
"@stackra/infra-github": patch
"@stackra/infra-testbed": minor
"@stackra/native-scale": patch
"@stackra/panel": patch
"@stackra/payments": patch
"@stackra/pricing": patch
"@stackra/runway": minor
"@stackra/support": patch
"@stackra/tokens": patch
"@stackra/ui": patch
"@stackra/vite-plugin": patch
---

Public packages carry nothing internal (STA-2876). Examples, fixtures, comments, READMEs and changelogs use neutral
names (acme, bistro, `dev.example`, `/Users/me`) instead of internal product, person, host, account and vault names.

`@stackra/runway`: a pull request's preview host lives in the product's own zone. Set
`environments.preview.domains.pullRequestZone` in the root runway (for example `preview.example`); a pull-request
`publishProduct` without it is refused before any upload or write. `pullRequestPreviewHost(product, n, zone)` takes the
zone and refuses one that is not a lowercase host name of two labels or more, and `PULL_REQUEST_PREVIEW_SETTINGS` no
longer has `zone`.

`@stackra/infra-testbed`: the boxes' EC2 key pair is a stack setting, `AwsTestbedOptions.keyPair` (Pulumi config
`keyPair`). `TESTBED_DEFAULTS` now defaults `keyPair` to `stackra-testbed`, `keyFile` to `~/.ssh/stackra-testbed.pem`
and `awsProfile` to `figentra`; a stack that uses another pair names it.
