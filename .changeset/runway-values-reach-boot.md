---
"@stackra/app": minor
"@stackra/gen": minor
"@stackra/actions": patch
---

Runway's `config` values and the deployed environment now reach boot, so the STA-2798 refusal of the memory action
stores holds on a real deployment and the advice it prints works.

- `@stackra/gen` writes `.stackra/gen/runway-config.ts` (`runwayConfig`) for a service whose runway, or the root's
  `defaults.service.config`, sets a `config` value: each environment's values by config key, the member's over the
  root's field by field. The server, seed and console entries pass it to `bootApp` as `runway`. It also writes
  `stackra-encore/<member>/environment.ts`, which every generated Encore file imports first: it sets
  `STACKRA_ENVIRONMENT` from Encore's `appMeta().environment`, since nothing set it on a deployed Encore service and a
  production service booted as `dev`.
- `@stackra/app`: `bootApp` takes `runway` (environment to config key to values) and applies the running environment's
  (`STACKRA_ENVIRONMENT`, `dev` when unset) as the values layer (ADR 0296); the server `createApp` takes the same
  `runway` option. New in `./server`: `runningEnvironment(declared, host)` and `HostEnvironment`. A `production` Encore
  environment runs as `production`, an `ephemeral` one as `preview`, any other cloud environment as its name or
  `staging`; `encore run` and `encore test` keep the declared value; a deployed environment that declares `dev` or
  `test`, or a self-hosted build with no infra metadata and no declared value, fails boot with `ConfigInvalidError`.

After upgrading, run `stackra gen` so each service gets the two new files. A self-hosted Encore build must set
`STACKRA_ENVIRONMENT` or the infra config's `metadata.env_type` and `cloud`.
