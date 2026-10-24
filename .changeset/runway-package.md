---
"@stackra/runway": minor
---

Add `@stackra/runway`, runway format version 3 (ADR 0296): the root, app and service runway schemas, which accept and
refuse what the canonical `tools/schemas/runway-*.schema.json` do (member runways refuse every root key, a dedicated
resource needs a reason, `requires` engines are `postgres`, `valkey`, `s3` and `sns-sqs`, a grouped topology needs
groups); `parseRunway`, `checkPlacement` (every service member placed exactly once in a grouped environment),
`runwayJsonSchema` and the shipped `schema/{root,app,service}.json`, byte copies of the canonical files; the readers
`baseUrlOf`, `devPorts` and `updateFeed` over the resolved runway facts (`.stackra/dev/ports.json`, or the
`__STACKRA_RUNWAY__` a bundle carries), folded in from the old `./ports` entry; and `./node` with `definesFor`,
`devServer` (folded in from the old `./vite` entry) and `readRunway`.
