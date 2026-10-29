---
"@stackra/gen": patch
---

Gen a v2 service (an authored `src/main.ts`, until STA-344) without the v3 runtime entry, tool configs and Encore app
file, so `stackra gen` no longer refuses services/example and services/health with `generated_dependency_missing`,
`encore_app_missing` or `shim_authored`. A v3 service is checked as before.
