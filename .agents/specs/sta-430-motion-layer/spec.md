# Feature Specification: the motion layer, motion tokens, Reveal and animation on by default

**Feature Branch**: `figentra/sta-430-motion-layer`

**Created**: 2026-10-24

**Status**: Done

**Linear**: STA-430

**Linear project**: Stackra Design System

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: STA-430 and the coordinator's brief of 2026-10-24:

1. Motion tokens and a `Reveal` wrapper: Motion on web, Reanimated on native.
2. Animation on by default in charts, KPI, NumberValue, progress, trend chips, lists and toasts.
3. Reduced motion respected throughout.
4. The owner's glass decision: never animate opacity on a native `GlassView` or its parents, never animate a blur
   radius on web; animate transform or opacity on the element inside the material.

## Impact

- **Apps touched**: the playground's NumberValue page test only (it reads the rolling number through a NumberFlow
  stand-in). The playground and the mobile app pick up the defaults through the packages.
- **Services touched**: none
- **Packages touched**: `packages/design-system/tokens`, `packages/design-system/ui`, `packages/design-system/ui-pro`
- **Public contract change**: `@stackra/tokens` gains the `reveal` and `stagger` motion steps and `motionTiming`;
  `@stackra/ui` gains `Reveal` and `List`'s `isAnimated`; `@stackra/ui-pro` (private) gains `NumberValue`'s
  `isAnimated` and animated defaults
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: yes, ADR 0329
- **New dependencies**: `motion` (already in `catalog:frontend`) as a dev dependency and peer of `@stackra/ui`;
  `@stackra/tokens` (`workspace:*`) as a dependency of `@stackra/ui` and `@stackra/ui-pro`
- **Deploy modes**: none; libraries
- **Licence tier**: MIT code over Motion (MIT), Reanimated (MIT), NumberFlow (MIT) and HeroUI Pro's own props
- **Docs to update**: the `@stackra/tokens` README, ADR 0329, the index and the docs navigation
- **Lane**: lite
- **Change risk**: R1

## User Scenarios & Testing

- **US1**: A screen built from the design system gets entrances, chart motion and rolling numbers without per-screen
  code, all on one set of theme timings.
- **US2**: A user who asks the system for reduced motion sees every one of those at rest.

## Edge cases

- **EC-01**: A list on a glass surface reveals its rows inside the surface, so the material never has an animated
  ancestor.
- **EC-02**: A caller's own animation props (`areaProps`, `animate`, `isAnimated={false}`) win over the defaults.
- **EC-03**: A number NumberFlow cannot draw (scientific or engineering notation, or a locale whose digits are not
  Latin, such as `ar-SA`), and a render-prop child, get HeroUI Pro's still number.

## Requirements

- **FR-001**: `@stackra/tokens` SHALL add the `reveal` and `stagger` motion steps, render their durations as `0ms`
  under reduced motion, and export `motionTiming(theme, name)`, which reads a step as milliseconds and a bezier.
- **FR-002**: `@stackra/ui` SHALL ship a web `Reveal` on Motion: a fade and an 8px rise on the `reveal` step, delayed
  by `index` × `stagger`.
- **FR-003**: `@stackra/ui` SHALL ship a native `Reveal` on Reanimated with the same timing, following the system's
  reduce-motion setting.
- **FR-004**: `Reveal` SHALL render its child at rest under reduced motion and with `isAnimated={false}`.
- **FR-005**: The web `Kpi.Chart` SHALL draw its sparkline in on the `reveal` step with Recharts' `auto`, and a
  caller's `areaProps` SHALL win.
- **FR-006**: The native charts SHALL give their series a timing `animate` on the `reveal` step, and a caller's
  `animate` SHALL win.
- **FR-007**: The web `NumberValue` SHALL roll its number with NumberFlow on the `reveal` step unless `isAnimated` is
  off, a render prop is given, the notation is scientific or engineering, or the locale's digits are not Latin.
- **FR-008**: `List` SHALL reveal its rows inside its surface on both platforms unless `isAnimated` is off.

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change. Verified by: CI (Quality Gate), in the testing pass the owner
  schedules

## Out of scope

- Animation for the native `NumberValue` and for `TrendChip`, which their libraries do not offer.
- Default animation for grouped native bars (`BarGroupItem`).
- The playground's axe scans emulating reduced motion, which is ds-web's.
- Element refraction on glass, which is deferred.

## Status history

- 2026-10-24 · — → Draft · Claude (ds-pro) · from STA-430 and the coordinator's brief (lite lane)
- 2026-10-24 · Draft → Clarified · Claude (ds-pro) · no open questions; the glass rules are the owner's
- 2026-10-24 · Clarified → Planned · Claude (ds-pro)
- 2026-10-24 · Planned → Tasked · Claude (ds-pro)
- 2026-10-24 · Tasked → Implementing · Claude (ds-pro)
- 2026-10-24 · Implementing → Done · Claude (ds-pro) · tests written; the owner's testing pass runs them
