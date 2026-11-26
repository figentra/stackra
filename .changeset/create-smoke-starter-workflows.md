---
"@stackra/cli": patch
---

`stackra create` no longer writes the starter repository's own workflows (`.github/workflows/starter-*.yml`, such as
the template's create smoke test) into a new app; the app's own workflows are written as before (STA-2829).
