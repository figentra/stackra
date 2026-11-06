---
"@stackra/infra-aws": patch
"@stackra/infra-github": patch
---

infra-aws: `productAccount` passes no `provider: undefined` or `parent: undefined` into resource options
(exactOptionalPropertyTypes), and `organizationLayout` reads an unknown `roots` as an empty root id instead of
throwing, so units register under previews and mocks. infra-github: the `./node` contract test names
`githubStack`'s `options` parameter.
