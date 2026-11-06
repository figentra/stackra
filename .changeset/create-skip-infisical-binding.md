---
"@stackra/cli": patch
---

`stackra create` no longer copies the template's `.infisical.yaml` into a new app, so the app never binds
Figentra's Infisical project; it sets up its own secrets.
