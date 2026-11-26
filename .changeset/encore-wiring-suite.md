---
"@stackra/gen": minor
"@stackra/cli": minor
"@stackra/flow-preset": patch
---

Every service that runs as a generated Encore app now gets a thin Encore wiring suite (ADR 0182 decision 3, STA-2838). Gen writes `.stackra/tests/encore-wiring.test.ts` and `.stackra/vitest.wiring.config.ts` for a service with its Encore service declaration, no authored `src/main.ts`, and `vitest` and `@stackra/vitest-config` declared. The suite checks the wiring only: the Encore service and its name, the boot from the root module, every generated endpoint (each route answers its CORS preflight with 204; each route no anonymous caller may reach refuses a call without a credential, and one whose bearer token does not verify, with 401 `request_refused`), every CronJob, topic and subscription, and the service database with each model table migrated. It sends no valid credential, so it changes no data. `@stackra/gen` exports `ENCORE_WIRING_TEST`, `ENCORE_WIRING_CONFIG` and `emitEncoreWiringTest`; the generated `api.ts` is unchanged (its rows now come from the same reader the suite uses).

`stackra test --tier wiring` runs it: in a service it generates, then starts `encore test` with `STACKRA_TEST_TIER=wiring`; the `stackra test` that Encore starts reads the tier from that variable, skips gen, and runs Vitest with the generated config inside the Encore runtime. At the workspace root it runs `turbo run test:wiring` (a new uncached task). `stackra new service` writes a `test:wiring` script. It needs Encore and Docker.

The stackra Flow preset's task vocabulary lists the `test:wiring` task.
