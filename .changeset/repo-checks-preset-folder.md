---
"@stackra/repo-checks": patch
---

`stackra validate --repository` reads a preset folder in flow.config.json (`"preset": "./…"`) by the `preset.id` its
`preset.yml` declares, so a repository that names its preset by folder gets that template's layout check. A folder
whose id is no template, or that has no `preset.yml`, is still refused as having no template.
