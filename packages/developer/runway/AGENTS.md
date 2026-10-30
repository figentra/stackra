# AGENTS — @stackra/runway

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/runway: where code goes, the schema, deploy, secrets and event fan-out rules, PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0296; ADR 0352; ADR 0002 (2026-10-27 amendment, the `mintlify` provider); ADR 0400; ADR 0444 (`providers.tools`); ADR 0441; ADR 0439 (the mobile job); ADR 0441 as amended (D17 brand step, D19 capture job); ADR 0453 (`providers.npm`); ADR 0437 and app-shells 5.3, 15.7, 16.3, 16.4, 16.7 (the publish step); STA-863; ADR 0260 (decision 4: the relay fan-out
                    is gen's).
-->

Runway format version 3 (ADR 0296) as code. Member at `packages/developer/runway` (`tier:lib`). Entries `.` and
`./node`, plus the `schema/{root,app,service}.json` assets, byte copies of `tools/schemas/runway-*.schema.json`
(ADR 0127, 2026-10-24 note).

## Where code goes

| You are writing…                        | It goes in…                                 |
| --------------------------------------- | ------------------------------------------- |
| A runway zod schema (internal)          | `src/core/constants/<name>.constant.ts`     |
| An enum                                 | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| An error                                | `src/core/errors/<name>.error.ts`           |
| An isomorphic function (no Node import) | `src/core/functions/<name>.function.ts`     |
| A Node-only function (reads files)      | `src/node/functions/<name>.function.ts`     |
| A port (the deploy provider)            | `src/core/ports/<name>.port.ts`             |
| A deploy provider driver (runs a CLI)   | `src/node/drivers/<name>.driver.ts`         |
| A Node-only driver's config             | `src/node/config/<name>.config.ts`          |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- `.` stays bundle-safe: no static `node:*` import; the dev facts file is read through `process.getBuiltinModule`.
- The canonical schemas are `tools/schemas/runway-<kind>.schema.json`, owned by main: never edit `schema/<kind>.json`
  by hand; `cp` the canonical file (`pnpm validate` checks the bytes) and change the zod to match (the
  `runwayJsonSchema` test compares them).
- Agents never call `deploy`, `promote` or `rollback` against a real provider, and never run `git push encore://`,
  `eas build`, `eas update` or a push of a docs deploy branch: tests use fake command runners; a real run is the deploy workflow's (ADR 0352 d6).
- The `mintlify` provider publishes a docs app's generated `.stackra/site/` to `targets.mintlify.branch`; it reads
  no Mintlify key (the GitHub app deploys the branch) and never pushes `src/` (ADR 0002 amendment, STA-1316).
- `providers.npm.registry` is the one registry setting (ADR 0453): never hard-code a registry URL in code or a
  member's `publishConfig`; the release workflow passes it to `runway-npm.yml` as its `registry` input.
- Provider settings are runway data (`targets.<destination>`, `environments.<env>.encore|mobile`, a dedicated
  deployment's own blocks); a provider never hard-codes a branch, channel or profile.
- Event fan-out is gen's (`.stackra/encore/<member>/events.ts` and a relay service's `relay.ts`), never a runway key:
  do not add per-service subscriber lists to a runway; document topology effects in the README's fan-out section.
- `providers.tools` (the per-region self-hosted tools stack, ADR 0444) stays an open provider block here;
  `@stackra/infra-tools` owns its schema. Do not type it in the root zod or the canonical schema.
- `surfaces.ops.contributes` stays declarative: a package name or entries over registered block ids with data props;
  never add a component, entry, script or module-path key to it (app-shells 16.7). Asset paths stay inside `assets/`.
- The repository index table lives only in the root runway's `environments.dev.lanes.repos`; do not copy it into
  code or another file. A new dev port field must be added to `checkPorts` so duplicates keep failing.
- The mobile job (`runMobileJob`) strips capabilities at build time from the template line's `capabilities.json`;
  never hard-code a capability, module, plugin or permission here (the one exception is `AD_ID_PERMISSION`, blocked
  unless an enabled flag lists it), and never hide a feature at run time instead. It
  never publishes a white-label build under the platform's Apple account without the 4.2.6 and 4.3 record, and takes
  store accounts resolved (`storeAccountsOf`, @stackra/infra-mobile); it never reads a store key.
- Mobile onboarding (`onboardMobile`, ADR 0482) reaches Apple, Google Play, Expo, Google Cloud, Firebase, Sentry and
  Infisical only through its ports (`src/core/ports/`); each has a real driver and a `Memory…` driver in
  `src/node/drivers/`, and a new store call gets both. Drivers read secrets by NAME from the job's environment per
  request (`secretOf`) and send them only inside it (`requestJson` never puts a header or body in an error). Runway
  never generates or holds a signing credential (EAS does); the one key it creates (FCM v1) goes to `VaultWriter` and
  EAS from a local and is never returned, logged or written to disk. A set store id is never changed.
- The one entitlement written from runway data rather than a capability is Sign in with Apple: `apple` in
  `mobile.<app>.signIn.social` sets `usesAppleSignIn` and `com.apple.developer.applesignin` (STA-1578). A social list
  without `apple` is a schema refusal (App Store guideline 4.8); keep that refine and both JSON schema copies in step.
- The brand step (`runBrandStep`) runs the @stackra/brand-kit binary and never imports the kit; output codes and
  folders live in `BRAND_STEP_SETTINGS`. Generated brand files stay under `.stackra/brand` and are never committed:
  `committedBrandOutputs` fails the step on any tracked file a kit manifest lists. Do not edit @stackra/brand-kit from
  here; a white-label run reads the scope's theme only as a kit folder another job wrote.
- The capture job (`screenshotCaptureJob`) is plain data printed before it runs; `runScreenshotCapture` runs it on a
  Mac CI runner only. Defaults live in `SCREENSHOT_CAPTURE_DEFAULTS`; app, locale and screen ids are checked before
  they become paths.
- The publish step (`publishProduct`, `publishShell`, `promoteCanary`) writes the edge KV copy only through the
  `EdgeKvWriter` port (@stackra/app `./contracts`) and only platform rows: never a scope's `host:`, `boot:` or
  `wellknown:` row (the edge projector's). Every check runs before the first upload or write. Thresholds, windows,
  folders, commands and headers live in `EDGE_PUBLISH_SETTINGS`; a timer alone never promotes a canary. Agents never
  run `wrangler kv` or `wrangler r2` against a real namespace or bucket: tests use `MemoryEdgeKv` and fake runners.
- A runway holds secret names only. `definesFor` inlines public vars (`VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_`) and
  never the TLS paths.
- A provider takes `RunwayConfig` (`src/config/runway.config.ts`, key `runway`) by constructor type, never an options
  object (gen's `token_not_a_class`); its `run` field is the command runner a test or a dry run replaces.
- A provider's verify reads a deployment's health at `/readyz` (@stackra/app's readiness route), never `/healthz`
  (liveness only); the `encore-cloud` driver's `fetch` field is the HTTP client a test replaces. Verify reports down,
  it never throws.
- A service's pool size is runway data: `database.poolBudget` is what all its instances hold together, and
  `poolMaxOf` is the only place that divides it by the group's `instances.max` (ADR 0473). Never put a pool size in a
  provider or in code.
- A preview's database source is runway data (`environments.preview.shared.database.from`, `profile`, `branch`),
  read only through `previewDatabaseOf`. Branching runs the service's own CLI (`neonctl`) behind
  `PreviewDatabaseBrancher`; never pass an API key as an argument and never log a connection string.

## PII

None. A runway holds resource declarations, public vars and secret names; never a secret value or a person's data.
