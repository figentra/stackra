---
"@stackra/gen": minor
---

Gen refuses a service that could boot a deployment as `dev` (STA-1571). `authored_main_environment`: a v2 service that
runs `@stackra/app` from an authored `src/main.ts` gets no generated `environment.ts`, so an unset
`STACKRA_ENVIRONMENT` would read as `dev` there; delete `src/main.ts` so gen writes the server entry (STA-344), or drop
`@stackra/app`. `app_version_floor`: an installed `@stackra/app` older than `0.34.0` (`APP_ENVIRONMENT_FLOOR`, the first
release that exports `providePlatformEnvironment`) cannot load the `environment.ts` gen writes; upgrade `@stackra/app`
with the rest of `@stackra/*`. The floor is never above gen's own version.
