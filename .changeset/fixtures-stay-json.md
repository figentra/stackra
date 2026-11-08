---
"@stackra/repo-checks": patch
---

`checkJsonConfigs` lets a test fixture under `__tests__/fixtures/` stay `.json`: it is a provider's own wire format, a
recorded API answer the test parses exactly as the provider sends it. Product repos no longer fail `json-configs` on
their connector fixtures.
