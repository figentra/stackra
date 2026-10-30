# Feature Specification: automated mobile launch check (Maestro on CI simulators and emulators)

**Feature Branch**: `figentra/sta-265-mobile-launch-check`

**Created**: 2026-10-30

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-265

**Clarifications status**: complete (owner approved D1 to D5 as drafted, 2026-10-30)

**Input**: On 2026-10-30 a launch crash reached core main unnoticed: the template app's App Tracking Transparency
status read called `RCTFatal` at launch (fixed in STA-1625). No automated check ever launches the app, and the
tester's boxes have no simulator. The owner asked for the best setup; the answer was layers (local simulator in
development, Maestro smoke flows on CI simulators and emulators, Sentry crash-free rates on staged rollouts, possibly
AWS Device Farm later). This spec is the second layer, done the cheapest way that still launches the real app.

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: `apps/mobile` of the OS repository (the os/mobile@3 line: one Maestro flow and one ready marker)
- **Services touched**: none
- **Packages touched**: `@stackra/runway` (`./node`: the launch check job, its defaults and a `simulator` EAS profile)
- **Cross-service events**: none
- **Tenancy and data**: none; the app under test runs its own demo scope on a throwaway simulator
- **Secrets**: none new; the EAS build reads `EXPO_TOKEN` from Infisical by name, as the mobile job already does
- **ADR needed**: no; ADR 0441 (D19) already puts a simulator lane on a Mac CI runner, and this adds a check to it
- **New dependencies**: no npm package or catalog entry; one CLI on the CI runners, Maestro (D1, owner to confirm)
- **Deploy modes**: CI only (GitHub-hosted runners); nothing is deployed
- **Lane**: lite
- **Change risk**: R1 (a new CI check; it can block a promotion, never ship anything)
- **Licence tier**: free
- **Docs to update**: `packages/developer/runway/README.md` (launch check section), the mobile release runbook (`.agents/skills/mobile-release/SKILL.md`), `apps/mobile/README.md` in the OS repository

## Owner decisions _(approved as drafted, 2026-10-30)_

- **D1. Maestro, pinned in mise.** The open-source Maestro CLI (Apache-2.0, free) runs the flows. It is pinned in
  the runner's `mise.toml` like the other CLI tools (ADR 0027), not added as an npm package. Maestro Cloud (paid) is
  not used.
- **D2. Runners.** iOS: the GitHub macOS runner the store-screenshot capture job already uses
  (`SCREENSHOT_CAPTURE_DEFAULTS.runner`, `macos`). Android: `ubuntu-latest` with KVM and an emulator started by a
  pinned `reactivecircus/android-emulator-runner` step. EAS Workflows (paid) only if the owner prefers it.
- **D3. When it runs.** On a template line release (before the line package is published) and on a product's preview
  deploy of a mobile app, only when the app or its line changed. Never on every push or PR (STA-256: paid jobs never
  on push/PR); macOS minutes bill at the macOS rate, about ten times Linux.
- **D4. The app under test.** A Release simulator build from a new `simulator` EAS profile (`ios.simulator: true`,
  Android APK, channel `preview`), so the capture job and the launch check share one build. The free alternative is
  `expo run:ios --configuration Release` on the runner (no EAS build, about 20 more macOS minutes per run).
- **D5. A failure blocks promotion.** The promote workflow `needs` the launch check job; a failed or skipped check
  stops staging → production for that app. No override flag.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A line release that crashes at launch is not published (Priority: P1)

A change to os/mobile@3 makes the app fatal at launch (as STA-1625 did). The line release runs the launch check on an
iOS simulator and an Android emulator before publishing.

**Acceptance Scenarios**:

1. **Given** a line build that calls `RCTFatal` at launch, **When** the line release runs, **Then** the launch check
   fails, the JUnit report and the last screenshot are kept as evidence, and the line package is not published.
2. **Given** a healthy line build, **When** the line release runs, **Then** both platforms pass and the release goes on.

### User Story 2 - A product's preview build is launched before it can be promoted (Priority: P1)

A product's preview deploy builds its mobile app; the capture job's runner launches it before capturing screenshots.

**Acceptance Scenarios**:

1. **Given** a preview build that does not reach its first screen, **When** the capture job runs, **Then** the launch
   check fails before any screenshot is taken, and promoting that commit is refused.
2. **Given** a preview build that reaches its first screen, **When** the capture job runs, **Then** the launch check
   passes and the capture runs on the same runner.

### User Story 3 - Later flows per capability (Priority: P3)

A capability (camera, scanner) adds its own flow next to the launch flow; it opens the demo deep links the capture job
already uses. Out of scope to write now; the job takes a list of flows so nothing changes to add one.

### Edge Cases

- The simulator or emulator never boots: the job fails (an infrastructure failure still blocks; rerun the job).
- A dev-client build is passed by mistake: it waits for Metro and never shows the marker, so it fails, as it should.
- A flow path outside the template checkout, or an app key that is not a safe path segment: refused before anything runs.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Runway shall define `launchCheckJob(request)`: from the root runway's `mobile` entry (iOS bundle id,
  Android package) and a platform (`ios` or `android`), the ordered commands that install the build, run each Maestro
  flow with `APP_ID` set, write a JUnit report and the flow's screenshots under
  `<outDir>/<app>/<platform>/`, and, on iOS, boot and shut down the simulator. Plain data, printable before it runs.
- **FR-002**: Runway shall run that list with `runLaunchCheck(job, repository, run?)` through the `CommandRunner` port,
  stopping at the first failing command (ADR 0352 decision 3: the list printed is the list run).
- **FR-003**: Every key a request leaves out shall come from `LAUNCH_CHECK_DEFAULTS` (runner per platform, the
  capture job's simulator, flows `[".maestro/launch.yaml"]`, `outDir` `.stackra/launch-check`).
- **FR-004**: `easJsonOf` shall add a `simulator` build profile (D4).
- **FR-005**: os/mobile@3 shall ship `.maestro/launch.yaml` in its package: cold launch with cleared state, wait up
  to 60 s for the ready marker, assert no red screen or fatal error text, take a screenshot.
- **FR-006**: os/mobile@3 shall render the accessibility id `stackra-launch-ready` once the container has booted and
  the navigator has mounted, in release and development builds.
- **FR-007**: The line release workflow and the product preview capture job shall run the launch check, and the
  promote workflow shall need it (D3, D5).

### Success Criteria

- **SC-001**: Reverting the STA-1625 fix on a branch makes the line's launch check fail on iOS.
- **SC-002**: A healthy line passes on both platforms in under 15 minutes of runner time per platform, build excluded.
- **SC-003**: No developer Mac and no tester box needs a simulator for the check to run.

## Out of scope

- Real devices (AWS Device Farm): a later release-candidate layer.
- Crash-free rates on staged rollouts (Sentry): the production layer, its own issue.
- Capability flows (camera, scanner): added later as flow files, no job change.

## Lanes _(for the tester session, stackra-f4)_

| Lane          | Repo, branch                                      | Owns                                                                                               | Tester runs                                             |
| ------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| L1 runway job | core, `figentra/sta-265-mobile-launch-check`      | `packages/developer/runway/src/node/**/launch-check*`, `eas-json-of*`, README, CHANGELOG changeset | runway vitest, typecheck, `pnpm validate`               |
| L2 line flow  | os, branch off `figentra/sta-1602-template-lines` | `apps/mobile/.maestro/`, the ready marker, `package.json` `files`                                  | mobile vitest; one Maestro run on a Mac runner (SC-001) |
| L3 workflows  | os `lines.yml`; product template workflows        | the launch check steps and the promote `needs`                                                     | a workflow dry run; SC-002 timing                       |
| L4 runbook    | core                                              | the mobile release runbook section                                                                 | docs build                                              |

Lane state (2026-10-30, not gated): L1 built on core `figentra/sta-265-mobile-launch-check`; L2 built on os
`figentra/sta-265-launch-flow` (off `figentra/sta-1602-template-lines`, Maestro `cli-2.12.0` pinned in os `mise.toml`);
L4 built with L1 (`apps/docs/src/docs/runbooks/mobile-release.mdx`). L3 is not built: no workflow calls the capture job
or the launch check yet, and a workflow needs a CLI entry (`stackra mobile launch-check`) or a node script to call
`launchCheckJob`; that, the `lines.yml` jobs and the promote `needs` are the next build round.

## Status history

- 2026-10-30 → Draft (spec written for the owner's review)
- 2026-10-30 → Clarified (owner approved D1 to D5: Maestro in mise, GitHub macOS and ubuntu KVM runners with the pinned emulator action, the `simulator` EAS profile, blocks promotion)
