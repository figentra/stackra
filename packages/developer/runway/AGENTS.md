# AGENTS — @stackra/runway

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/runway: where code goes, the schema, deploy, secrets and event fan-out rules, PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0296; ADR 0352; ADR 0002 (2026-10-27 amendment, the `mintlify` provider); ADR 0400; ADR 0444 (`providers.tools`); ADR 0441; ADR 0439 (the mobile job); ADR 0441 as amended (D17 brand step, D19 capture job); ADR 0453 (`providers.npm`); STA-863; ADR 0260 (decision 4: the relay fan-out
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
  never hard-code a capability, module, plugin or permission here, and never hide a feature at run time instead. It
  never publishes a white-label build under the platform's Apple account without the 4.2.6 and 4.3 record, and takes
  store accounts resolved (`storeAccountsOf`, @stackra/infra-mobile); it never reads a store key.
- The brand step (`runBrandStep`) runs the @stackra/brand-kit binary and never imports the kit; output codes and
  folders live in `BRAND_STEP_SETTINGS`. Generated brand files stay under `.stackra/brand` and are never committed:
  `committedBrandOutputs` fails the step on any tracked file a kit manifest lists. Do not edit @stackra/brand-kit from
  here; a white-label run reads the scope's theme only as a kit folder another job wrote.
- The capture job (`screenshotCaptureJob`) is plain data printed before it runs; `runScreenshotCapture` runs it on a
  Mac CI runner only. Defaults live in `SCREENSHOT_CAPTURE_DEFAULTS`; app, locale and screen ids are checked before
  they become paths.
- A runway holds secret names only. `definesFor` inlines public vars (`VITE_`, `EXPO_PUBLIC_`, `RENDERER_VITE_`) and
  never the TLS paths.

## PII

None. A runway holds resource declarations, public vars and secret names; never a secret value or a person's data.
