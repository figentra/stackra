---
"@stackra/gen": minor
---

Gen builds a Fumadocs site from a docs member too: a member whose package.json has `"stackra": { "kind": "docs" }`, with its pages under `content/`, its navigation in each folder's `meta.json` and its settings in `docs.yaml`, described by the new `@stackra/gen/schema/docs.json`. A docs app with `src/config/docs.config.ts` builds exactly as before.
