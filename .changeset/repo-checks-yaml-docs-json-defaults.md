---
"@stackra/repo-checks": patch
---

`checkYamlFlowMaps` reads every document of a multi-document YAML file, so a Maestro flow (its config, `---`, then
its commands) validates. A service's `assets/defaults/*.json` stays JSON: it is imported as a JSON module, which
takes no YAML and no comments.
