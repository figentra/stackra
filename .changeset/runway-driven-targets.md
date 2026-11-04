---
"@stackra/runway": minor
"@stackra/repo-checks": minor
---

`checkDestinations(root)` refuses a destination or target block no driver serves (owner decision O8):
destinations must be `encore-cloud`, `cloudflare-workers`, `eas` or `mintlify`, and target blocks one of
those, `npm` or `electron-release` (the desktop feed origin builds read). `stackra validate` runs it on the
root runway. Core's dev environment drops its `compose`, `vite-dev`, `expo-dev` and `mint-dev` lines.
