# Feature Specification: iOS form-factor rules for the iPhone Duo and resizable windows

**Feature Branch**: `figentra/sta-461-iphone-duo-form-factor-rules-for-the-ios-target-no`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-461

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: The owner's platform-targets plan (2026-10-24): Apple's foldable iPhone Duo went on sale 2026-10-23, so the
iOS target takes any size and rotation: no orientation lock, no full-screen request, the scene lifecycle (needed for
any iOS 27 SDK build), and no sizing from the device or its model.

## Impact

- **Apps touched**: `apps/mobile` (`app.json`: no portrait lock, the scene lifecycle plugin; `package.json`)
- **Services touched**: none
- **Packages touched**: none
- **Workers touched**: none
- **Public contract change**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no, it applies the owner's platform-targets plan; the form-factor ADRs are adr-wave's (STA-469)
- **New dependencies**: `expo-build-properties` 57.0.22 in the `mobile` catalog (the SDK 57 line), for owner review
- **Deploy modes**: every mode; iOS clients
- **Licence tier**: the private app; the scaffold template
- **UI surfaces**: the whole mobile app, which now rotates and resizes
- **Docs to update**: none
- **Lane**: lite (recorded reason: two config files, a template and two validator checks, scoped by the owner)
- **Change risk**: R1 (layout; no data, no credentials)

## User Scenarios & Testing

### User Story 1 - A person uses the app on the iPhone Duo or in a resizable window (Priority: P1)

A person opens the Stackra app on a foldable iPhone or in a resizable iPad window, folds, unfolds or rotates it, and the
app follows the window it is given.

**Independent Test**: the validator tests for `checkIosFormFactor` and `checkWindowSizing`.

**Acceptance Scenarios**:

1. **Given** an Expo app config with `"orientation": "portrait"`, **When** the validator runs, **Then** it reports the
   lock.
2. **Given** app source calling `Dimensions.get`, **When** the validator runs, **Then** it reports it.

### Edge Cases

- **EC-01**: A config with no `orientation` at all is accepted (Expo's default).

## Requirements

- **FR-001**: THE mobile app and the mobile scaffold template SHALL lock no orientation, request no full screen and
  adopt the UIKit scene lifecycle (`expo-build-properties` `ios.enableSceneSupport` on SDK 57).
- **FR-002**: THE repository validator SHALL refuse an orientation lock or `ios.requireFullScreen` in an Expo app config
  and `Dimensions.get` in app source.

## Success Criteria

- **SC-001**: The validator tests pass — verified by: unit

## Out of scope

- The iPhone Duo screenshots, required in App Store submissions from April 2027.
- Layouts that adapt to the folded and unfolded sizes beyond what the screens already do.

## Assumptions

- `expo-build-properties` takes `ios.enableSceneSupport` on Expo SDK 57.0.23 or newer (the app is on 57.0.30); SDK 58
  builds the scene lifecycle in, so the plugin entry goes with the SDK 58 bump (STA-460).

## Status history

- 2026-10-24 · — → Draft · Claude (builder) · from the owner's platform-targets plan (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (builder) · the rules set by the plan
- 2026-10-24 · Clarified → Planned · Claude (builder)
- 2026-10-24 · Planned → Tasked · Claude (builder)
- 2026-10-24 · Tasked → Implementing · Claude (builder)
