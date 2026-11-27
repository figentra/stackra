---
"@stackra/app": minor
"@stackra/gen": minor
"@stackra/actions": patch
---

Runway's `config` values now reach boot, so the STA-2798 refusal of the memory action stores holds on a real
deployment and the advice it prints works.

- `@stackra/gen` writes `.stackra/gen/runway-config.ts` (`runwayConfig`) for a service whose runway, or the root's
  `defaults.service.config`, sets a `config` value: each environment's values by config key, the member's over the
  root's field by field. The server, seed and console entries pass it to `bootApp` as `runway`.
- `@stackra/app`: `bootApp` takes `runway` (environment to config key to values) and applies the running environment's
  as the values layer (ADR 0296). The running environment comes from the one reader, `readEnvironment` of
  `@stackra/config` (STA-2844): `dev` when `STACKRA_ENVIRONMENT` is unset, and a name outside the closed list fails boot
  with `ConfigInvalidError` instead of applying no environment's values. The server `createApp` takes the same `runway`
  option. A runway value for a runtime-only field (one mapped to `STACKRA_ENVIRONMENT`) fails boot.

After upgrading, run `stackra gen` so each service gets `runway-config.ts`. The environment a deployed Encore service
runs as comes from STA-2844's generated `environment.ts`.
