# Feature Specification: mobile onboarding and release in Runway

**Feature Branch**: `figentra/sta-1623-mobile-onboard`

**Created**: 2026-10-30

**Status**: Draft

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1623

**Clarifications status**: open (owner questions Q1 to Q4 below)

**Input**: "One runway command takes a product from no mobile app to a store-ready, auto-releasing app": identity,
EAS project and profiles, Apple bundle id and capabilities, EAS-managed signing, store keys by name from Infisical,
Expo push with the FCM v1 key, `eas submit` to TestFlight and the Play internal track, the store listing in the
release flow, and the manual first Play upload as a checklist Runway can detect. Every external call behind a port
with a mock driver; a dry run against academorix; a runbook in `apps/docs`.

## What already exists (and this spec does not rebuild)

| Piece                                                                                                     | Where                                                                 | State                                                      |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| `mobile.<app>` identity, stores, eas blocks                                                               | `MOBILE_APP_SCHEMA` (runway core)                                     | on main                                                    |
| Mobile build from the template line                                                                       | `runMobileJob`, `EasProviderDriver` (build, update, verify, rollback) | on main                                                    |
| `eas submit` of built apps                                                                                | `deployProduct` runs `eas submit` per build, inline (no driver)       | on main                                                    |
| Store accounts per app                                                                                    | `storeAccountsOf` (@stackra/infra-mobile)                             | on main                                                    |
| Screenshot capture defaults and job                                                                       | `SCREENSHOT_CAPTURE_DEFAULTS`, `screenshotCaptureJob`                 | on main                                                    |
| App Store Connect client (bundle ids, capabilities, versions, metadata, TestFlight, submit)               | `tools/scripts/store-asc.mjs`                                         | branch `release-automation`, ADR 0480 (Proposed), STA-1592 |
| Google Play client (edits, listings, tracks)                                                              | `tools/scripts/store-play.mjs`                                        | same, STA-1593                                             |
| Store data, privacy answers, checklist                                                                    | `pnpm store build`, `assets/store/<app>/`                             | same, STA-1595                                             |
| Root kit: ASC Admin key, Play service account, `EXPO_TOKEN`, Infisical store identity in `prod:/ci/store` | owner                                                                 | STA-1591, Owner Backlog                                    |
| eas.json node pin 24.22.0                                                                                 | scaffold template                                                     | STA-1621, done                                             |

This feature is the **onboarding** layer those lack (identity derivation, EAS project, signing, push key, first
upload detection) and one **release** entry that strings the existing steps together.

## Impact _(mandatory)_

- **Apps touched**: `apps/docs` (runbook page, ADR 0482)
- **Services touched**: none
- **Packages touched**: `@stackra/runway` (new ports, drivers, functions, `eas` driver gains `submit`), `@stackra/cli`
  (`mobile onboard` command, `--mobile-only` on product deploy). If Q2 is answered "move", ADR 0480's clients move from
  `tools/scripts/store-{asc,play,http}.mjs` into runway drivers and `store.mjs` imports them.
- **Cross-service events**: none
- **Tenancy and data**: none. Writes only the product's `runway.yaml` (`mobile.<app>.identity`, `eas`) and the template
  checkout's `eas.json`; white-label variants keep using `runMobileJob` unchanged
- **Secrets** (names only): `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_PRIVATE_KEY`,
  `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`, `EXPO_TOKEN` (all ADR 0480 root kit, `prod:/ci/store`), new
  `FCM_SERVICE_ACCOUNT_JSON` per product (`prod:/ci/store/<product>`). Read by name in CI only; no agent reads a value
- **ADR needed**: yes, ADR 0482 (draft beside this spec): EAS owns signing, onboarding is a Runway step with store
  ports, identity derivation rule, Play first-upload detection
- **New dependencies**: none (fetch and `node:crypto`, as ADR 0480)
- **Deploy modes**: SaaS (Figentra's store accounts) and white-label managed; bring-your-own accounts reuse the same ports
  with the scope's Connection credentials later (out of scope here)
- **Lane**: full
- **Change risk**: R3 (secrets, outbound HTTP to Apple, Google and Expo, CI permissions)
- **Licence tier**: free (`@stackra/runway`)
- **Docs to update**: runway README and AGENTS.md, cli README, `apps/docs` runbook `runbooks/mobile-onboarding.mdx`,
  skills `mobile-eas-setup` and `mobile-release` (point at the command)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Onboard a product's mobile app (Priority: P1)

The owner (or an agent, dry run) runs `stackra mobile onboard --app <key>` at a product root. Runway prints every step,
each as done, would-do, or manual, and stops at the first step that needs an owner portal action.

Steps, in order, each idempotent (a second run reports `done` and changes nothing):

1. **identity**: fill absent `identity.ios.bundleId` and `identity.android.package` from the product key (FR-002) and
   write them to `runway.yaml`; an id already there is kept (frozen at first upload, ADR 0439 decision 6).
2. **eas-project**: find the EAS project `<owner>/<slug>` (owner from `mobile.<app>.eas.owner`, default `figentra`;
   academorix uses `academorix`); create it if missing; write its id to `mobile.<app>.eas.project`.
3. **eas-profiles**: write `eas.json` build profiles `development`, `preview`, `production` (node `24.22.0` from
   `mise.toml`, never a major alone) and submit profile `production` (ASC app id, Play track `internal`) into the
   template checkout.
4. **apple-bundle**: register the bundle id and the capabilities the app declares (push when `capabilities` has `push`;
   Sign in with Apple when `signIn.social` has `apple`; associated domains when `identity.links` is set; app groups
   stay manual per ADR 0480).
5. **apple-app-record**: look up the App Store Connect app by bundle id. The API cannot create one: if missing, a
   manual step with the exact values (name, bundle id, SKU `<product>-<app>`, primary locale) and stop.
6. **signing**: `eas credentials` non-interactively through a build-credentials setup for `production` on both
   platforms; EAS creates and holds the distribution certificate, provisioning profile and Android keystore. Runway only
   reads whether they exist.
7. **push**: iOS: EAS's push key (created with signing). Android: the FCM v1 service-account key, read by name from
   Infisical in CI and uploaded to EAS (Q3). No Firebase project automation.
8. **store-keys**: check the root-kit names exist (vault preflight, ADR 0480 decision 8) and that the submit profile
   points at them; never a value.
9. **play-app**: look up the Play app by package name. The Play API cannot create an app nor take the first bundle: if
   missing or without any release, print the one-time checklist (FR-009) and stop; once a release exists, `done`.

**Acceptance Scenarios**:

1. **Given** academorix (live ids `app.academorix.mobile`, no EAS project id yet), **When** `stackra mobile onboard
--app academorix --dry-run`, **Then** identity is `done` (kept), every other step is printed with its planned call,
   and the manual steps left for the owner are listed at the end; nothing is written or called.
2. **Given** a product with no `identity.ios`, **When** onboard runs, **Then** `com.figentra.<product>.<app>` is written.
3. **Given** every step already done (mock drivers), **When** onboard runs again, **Then** every step is `done` and no
   write or create call is made.
4. **Given** the Apple app record is missing, **When** onboard runs live, **Then** it stops at `apple-app-record` with
   the exact manual values and exit code 2 (manual step pending), and later steps are listed as blocked.
5. **Given** a live run outside CI, **Then** it refuses (ADR 0480 decision 5).

### User Story 2 - Release the mobile app (Priority: P1)

`stackra build --product` then `stackra deploy --product --env <e> --mobile-only` (Q1) builds from the template line,
submits through the `eas` driver to TestFlight and the Play internal track, then runs the listing step.

**Acceptance Scenarios**:

1. **Given** finished builds, **When** deploy runs, **Then** `EasProviderDriver.submit` runs `eas submit --profile
production --id <build> --non-interactive` per platform and records the submission ids.
2. **Given** `release: update` and a runtime-compatible change, **Then** an OTA update is published and nothing is
   submitted (unchanged behaviour).
3. **Given** the Play app has no first release, **Then** the Android submit is refused with the checklist pointer and
   iOS still proceeds.
4. **Given** a store listing in `assets/store/<app>/`, **When** deploy runs with `--listing`, **Then** the listing step
   of ADR 0480 (`store ios` / `store android`) runs after submit with the captured screenshots.

### Edge Cases

- App key equals product key (academorix/academorix): the derived id drops the repeat, `com.figentra.academorix`.
- Product or app keys with `-`: kept in the bundle id, `_` in the Android package (Android forbids `-`).
- A white-label variant: onboarding is per variant identity later; this spec refuses `--variant` (out of scope).
- `eas.project: ref:expo.projectId` (academorix today): read through, replaced by the literal id on first write.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Runway shall expose `onboardMobile(request)` returning ordered steps, each `done | planned | manual |
blocked`, with the planned call or the manual instructions; the CLI `stackra mobile onboard` prints them.
- **FR-002**: Identity derivation shall be `com.figentra.<product>.<app>` (dropping `<app>` when it equals `<product>`),
  lower-case, `-` kept on iOS and turned into `_` on Android; it only fills absent ids.
- **FR-003**: Every external call shall go through a port with a real driver and a mock driver:
  `ExpoProjects` (find, create, credentials status, FCM key upload), `AppleDeveloper` (bundle id, capabilities, app
  lookup), `PlayConsole` (app lookup, has-release). The CLI-backed steps keep using `CommandRunner`.
- **FR-004**: A dry run shall make no external call and write no file, and print every planned call.
- **FR-005**: Live runs shall run only in CI (GitHub Actions), in the product's `production` environment for anything
  that creates in a portal; the dry run needs no secret.
- **FR-006**: Runway shall never generate, hold, print or write a signing credential or store key; secrets are read by
  name from the environment the CI job gets from Infisical.
- **FR-007**: `eas.json` written by Runway shall pin node to the exact `mise.toml` version and refuse a major-only
  value.
- **FR-008**: `EasProviderDriver` shall gain `submit(target, record)`; `deployProduct` shall use it instead of its
  inline `eas submit`.
- **FR-009**: The Play first-upload checklist shall list: create the app in Play Console with the package name, the
  default language and app name from `assets/store`, app or game and free or paid, the declarations; complete
  content rating, target audience, Data safety (answers from `pnpm store build`), app access with the demo account
  name; download the first `.aab` from EAS (`eas build:view`) and upload it to the internal track by hand; accept the
  Play App Signing default. Done is detected when the Play API shows any release on any track.
- **FR-010**: Exit codes: 0 all done, 2 a manual step is pending, 1 an error.
- **FR-011**: A runbook `apps/docs/src/docs/runbooks/mobile-onboarding.mdx` shall describe the command, every manual
  step and who does it.

## Success Criteria _(mandatory)_

- **SC-001**: Tests with the mock drivers cover every step's done, planned, manual and blocked states, idempotency, the
  dry run sending nothing, and no secret value in output.
- **SC-002**: A recorded dry run against a copy of academorix's runway lists every step and every owner step.
- **SC-003**: `pnpm verify` green on the tester's box.

## Open questions for the owner

- **Q1 — command shape.** The CLI is `stackra`, not `runway`. Recommended: `stackra mobile onboard [--app]` and
  `stackra deploy --product --env <e> --mobile-only` (mirrors `--surfaces-only`). Alternative: a new `stackra release
--mobile`.
- **Q2 — one ASC/Play client.** ADR 0480's clients are `.mjs` scripts in core's `tools/scripts`, not shipped to
  products. Recommended: move them into `@stackra/runway` as the `AppleDeveloper` and `PlayConsole` drivers (one
  implementation; `pnpm store` imports them), sequenced after release-automation lands. Alternative: onboarding gets
  its own small drivers and the two merge later.
- **Q3 — FCM v1 key into EAS.** `eas credentials` has no non-interactive upload. Recommended: the Expo GraphQL
  mutation eas-cli itself uses, behind `ExpoProjects` (a break shows as a failing step, not a bad release).
  Alternative: one manual `eas credentials` step per app in the runbook.
- **Q4 — Expo account per product.** `mobile.<app>.eas.owner`, default `figentra`; academorix → `academorix`. Others?

## Lanes (after approval)

| Lane | Content                                                                                                          | Depends                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| L1   | Ports `ExpoProjects`, `AppleDeveloper`, `PlayConsole` + mock drivers; identity derivation; `eas.owner` in schema | —                                          |
| L2   | `onboardMobile` steps and output; `eas.json` profile writer (node pin)                                           | L1                                         |
| L3   | Real drivers (per Q2/Q3)                                                                                         | L1, release-automation landed if Q2 = move |
| L4   | `EasProviderDriver.submit`; `deployProduct` uses it; Play first-release refusal                                  | L1                                         |
| L5   | CLI `mobile onboard`, `--mobile-only`, `--listing`; runbook; skills; ADR 0482                                    | L2, L4                                     |
| L6   | Academorix dry-run record (`SC-002`)                                                                             | L5                                         |

## Status history

- 2026-10-30 Draft, waiting for the owner on Q1 to Q4.
