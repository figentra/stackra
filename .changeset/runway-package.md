---
"@stackra/runway": minor
---

Add `@stackra/runway`, runway format version 3 (ADR 0296): the root, app and service runway schemas, where member
runways refuse every root key (`member`, `deployable`, `isolate`, `group`, `cpu`, `memory`, `instances`), a dedicated
resource needs a reason and `requires` engines are only those ADR 0227 allows; `parseRunway`, `checkPlacement` (every
service member placed exactly once in a grouped environment), `runwayJsonSchema` and the committed
`schema/{root,app,service}.json` files; the readers `baseUrlOf`, `devPorts` and `updateFeed` over the resolved runway
facts (`.stackra/dev/ports.json`, or the `__STACKRA_RUNWAY__` a bundle carries), folded in from the old `./ports`
entry; and `./node` with `definesFor`, `devServer` (folded in from the old `./vite` entry) and `readRunway`.
