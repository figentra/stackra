# @stackra/experience

## 0.33.0

### Patch Changes

- Updated dependencies [4937622]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
- Updated dependencies [41a5ff0]
- Updated dependencies [22493bf]
  - @stackra/i18n@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/ui@0.33.0
  - @stackra/clients@0.33.0
  - @stackra/documents@0.33.0
  - @stackra/icons@0.33.0
  - @stackra/tokens@0.33.0
  - @stackra/errors@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0
  - @stackra/support@0.33.0

## 0.32.0

### Patch Changes

- Updated dependencies [54db249]
  - @stackra/ui@0.32.0
  - @stackra/clients@0.32.0
  - @stackra/documents@0.32.0
  - @stackra/icons@0.32.0
  - @stackra/tokens@0.32.0
  - @stackra/errors@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/support@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [0f05f60]
- Updated dependencies [7179d1a]
  - @stackra/i18n@0.31.0
  - @stackra/ui@0.31.0
  - @stackra/clients@0.31.0
  - @stackra/documents@0.31.0
  - @stackra/icons@0.31.0
  - @stackra/tokens@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/errors@0.31.0
  - @stackra/support@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 2307506: New landing block `experience.capability_matrix` (`CapabilityMatrixBlock`, `CapabilityMatrix`): subjects by capability
  (carriers by rates, labels, pickups…) as a captioned table with row and column headers. Each cell is a
  `CapabilityState` (yes, no, coming), drawn as an icon with its word so a state never rests on colour, or a short note.
  The table scrolls inside a focusable, named region on narrow screens.
- d3c8b27: The fifteen blocks of the Stackra landing. `./react` has the components `SiteHeader`, `HeroMachine`, `CtaRow`,
  `Statement`, `ChapterTitle`, `Station`, `StepSwitcher`, `Surfaces`, `BentoGrid`, `TerminalStage`, `MonoDisplay`,
  `AskAi`, `ProductCards`, `SiteFooter` and `PageDock`; `.` has each one's `Block` class (`HeroMachineBlock`,
  `SurfacesBlock`, `TerminalStageBlock`, `PageDockBlock` and so on), each in its own folder so gen's key rule gives it
  `experience.<name>` (`experience.hero_machine`). The classes declare the document props: words as `LocalizedText`,
  nested shapes as plain types and closed choices as enums. Nothing registers the blocks yet: gen does not compile the
  block kind, so a page registers them itself. The hero draws its machine, a group named by its `label`: the action
  window piped into web, desktop and phone surfaces; the dock narrates the stations. They draw the blueprint direction (ruled sections, schematic windows, the station rail) on `@stackra/ui`
  and its blueprint token roles; art is drawn by `Illustration` from token-coloured mask layers, a dither band's poster
  comes per scheme, and every word comes in props.

### Patch Changes

- d3c8b27: `SiteHeader` and the `experience.site_header` block take `githubHref` as optional. A product's customer-facing landing
  leaves it out, and the bar then shows no code-host link.
- Updated dependencies [85cd1b5]
- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [88fb0eb]
- Updated dependencies [0394e56]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [d5a7d0a]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
- Updated dependencies [d3c8b27]
  - @stackra/ui@0.30.0
  - @stackra/contracts@0.30.0
  - @stackra/documents@0.30.0
  - @stackra/errors@0.30.0
  - @stackra/container@0.30.0
  - @stackra/clients@0.30.0
  - @stackra/tokens@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/icons@0.30.0
  - @stackra/support@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b4b6422]
- Updated dependencies [0e8f570]
  - @stackra/container@0.29.0
  - @stackra/clients@0.29.0
  - @stackra/documents@0.29.0
  - @stackra/icons@0.29.0
  - @stackra/ui@0.29.0
  - @stackra/errors@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0
  - @stackra/support@0.29.0

## 0.28.0

### Patch Changes

- @stackra/clients@0.28.0
  - @stackra/documents@0.28.0
  - @stackra/icons@0.28.0
  - @stackra/ui@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/errors@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/support@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/documents@0.27.0
  - @stackra/clients@0.27.0
  - @stackra/icons@0.27.0
  - @stackra/ui@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/errors@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/support@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- Updated dependencies [e5da198]
  - @stackra/ui@0.26.0
  - @stackra/documents@0.26.0
  - @stackra/clients@0.26.0
  - @stackra/icons@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/errors@0.26.0
  - @stackra/i18n@0.26.0
  - @stackra/support@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/clients@0.25.0
  - @stackra/documents@0.25.0
  - @stackra/icons@0.25.0
  - @stackra/ui@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/errors@0.25.0
  - @stackra/i18n@0.25.0
  - @stackra/support@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/clients@0.24.0
  - @stackra/documents@0.24.0
  - @stackra/icons@0.24.0
  - @stackra/ui@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/errors@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/support@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [6edeee4]
- Updated dependencies [a42a80c]
- Updated dependencies [dee48f0]
  - @stackra/ui@0.23.0
  - @stackra/clients@0.23.0
  - @stackra/documents@0.23.0
  - @stackra/icons@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/errors@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/support@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- Updated dependencies [3a9a6be]
  - @stackra/documents@0.22.0
  - @stackra/clients@0.22.0
  - @stackra/icons@0.22.0
  - @stackra/ui@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/errors@0.22.0
  - @stackra/i18n@0.22.0
  - @stackra/support@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/clients@0.21.0
  - @stackra/documents@0.21.0
  - @stackra/ui@0.21.0
  - @stackra/container@0.21.0
  - @stackra/errors@0.21.0
  - @stackra/i18n@0.21.0
  - @stackra/icons@0.21.0
  - @stackra/support@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/clients@0.20.0
  - @stackra/documents@0.20.0
  - @stackra/icons@0.20.0
  - @stackra/ui@0.20.0
  - @stackra/errors@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/contracts@0.20.0
  - @stackra/support@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/clients@0.19.0
  - @stackra/documents@0.19.0
  - @stackra/ui@0.19.0
  - @stackra/container@0.19.0
  - @stackra/errors@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/icons@0.19.0
  - @stackra/support@0.19.0

## 0.18.1

### Patch Changes

- @stackra/clients@0.18.1
  - @stackra/documents@0.18.1
  - @stackra/icons@0.18.1
  - @stackra/ui@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/errors@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/support@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/clients@0.18.0
  - @stackra/documents@0.18.0
  - @stackra/icons@0.18.0
  - @stackra/ui@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/errors@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/support@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/clients@0.17.2
  - @stackra/documents@0.17.2
  - @stackra/icons@0.17.2
  - @stackra/ui@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/errors@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/support@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/documents@0.17.1
  - @stackra/clients@0.17.1
  - @stackra/icons@0.17.1
  - @stackra/ui@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/errors@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/support@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/clients@0.17.0
  - @stackra/documents@0.17.0
  - @stackra/icons@0.17.0
  - @stackra/ui@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/errors@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/support@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/clients@0.16.0
  - @stackra/documents@0.16.0
  - @stackra/icons@0.16.0
  - @stackra/ui@0.16.0
  - @stackra/errors@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0
  - @stackra/support@0.16.0

## 0.15.0

### Patch Changes

- Updated dependencies [3c99709]
  - @stackra/documents@0.15.0
  - @stackra/clients@0.15.0
  - @stackra/icons@0.15.0
  - @stackra/ui@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/errors@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/support@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/clients@0.14.4
  - @stackra/documents@0.14.4
  - @stackra/icons@0.14.4
  - @stackra/ui@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/errors@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/support@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/clients@0.14.3
  - @stackra/documents@0.14.3
  - @stackra/icons@0.14.3
  - @stackra/ui@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/errors@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/support@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/clients@0.14.2
  - @stackra/documents@0.14.2
  - @stackra/icons@0.14.2
  - @stackra/ui@0.14.2
  - @stackra/errors@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/contracts@0.14.2
  - @stackra/support@0.14.2

## 0.14.1

### Patch Changes

- @stackra/clients@0.14.1
  - @stackra/documents@0.14.1
  - @stackra/icons@0.14.1
  - @stackra/ui@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/errors@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/support@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/clients@0.14.0
  - @stackra/documents@0.14.0
  - @stackra/icons@0.14.0
  - @stackra/ui@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/errors@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/support@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/clients@0.13.0
  - @stackra/documents@0.13.0
  - @stackra/icons@0.13.0
  - @stackra/ui@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/errors@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/support@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/clients@0.12.0
  - @stackra/documents@0.12.0
  - @stackra/icons@0.12.0
  - @stackra/ui@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/errors@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/support@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/clients@0.11.1
  - @stackra/documents@0.11.1
  - @stackra/icons@0.11.1
  - @stackra/ui@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/errors@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/support@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/clients@0.11.0
  - @stackra/documents@0.11.0
  - @stackra/icons@0.11.0
  - @stackra/ui@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/errors@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/support@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0
  - @stackra/clients@0.10.0
  - @stackra/documents@0.10.0
  - @stackra/icons@0.10.0
  - @stackra/ui@0.10.0
  - @stackra/errors@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0
  - @stackra/support@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [681d01a]
- Updated dependencies [2e43c48]
- Updated dependencies [681d01a]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/clients@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/ui@0.9.0
  - @stackra/container@0.9.0
  - @stackra/documents@0.9.0
  - @stackra/icons@0.9.0
  - @stackra/errors@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/support@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/clients@0.8.0
  - @stackra/documents@0.8.0
  - @stackra/icons@0.8.0
  - @stackra/ui@0.8.0
  - @stackra/errors@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0
  - @stackra/support@0.8.0

## 0.7.1

### Patch Changes

- @stackra/clients@0.7.1
  - @stackra/documents@0.7.1
  - @stackra/icons@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/support@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/clients@0.7.0
  - @stackra/documents@0.7.0
  - @stackra/icons@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/support@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/clients@0.6.1
  - @stackra/documents@0.6.1
  - @stackra/icons@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/support@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Patch Changes

- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/ui@0.6.0
  - @stackra/clients@0.6.0
  - @stackra/documents@0.6.0
  - @stackra/icons@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/support@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/clients@0.5.1
  - @stackra/documents@0.5.1
  - @stackra/icons@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/support@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/clients@0.5.0
  - @stackra/documents@0.5.0
  - @stackra/icons@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/support@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [9c8d108]
- Updated dependencies [3c30885]
- Updated dependencies [c9cf778]
- Updated dependencies [1856ee0]
- Updated dependencies [ca7d004]
- Updated dependencies [eccdaf0]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
- Updated dependencies [ff56870]
- Updated dependencies [e219411]
- Updated dependencies [8d29426]
- Updated dependencies [58c7da9]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/documents@0.4.0
  - @stackra/support@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/clients@0.4.0
  - @stackra/icons@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0

## 0.3.0

### Minor Changes

- 4a6abd7: Add the module UI kits (ADR 0504): each module's `./react` entry ships its domain blocks on `@stackra/ui`, every word
  and value in props. `@stackra/ai/react`: `ChatSurface`. `@stackra/pricing/react`: `PricingTable`.
  `@stackra/payments/react`: `Cart` and `Checkout`. `@stackra/identity/react`: `SignIn`. `@stackra/experience/react`:
  `FeatureSection` and `CtaSection`.

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [895a526]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
  - @stackra/clients@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/documents@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/icons@0.3.0
  - @stackra/support@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [9085c41]
- Updated dependencies [c4f295e]
  - @stackra/errors@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/documents@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- e8ab3ca: Add document kinds (`ExperienceKind`: page, screen, form, email template, print document, theme section) with a
  `kinds` option on `Block` (a page and a screen by default) and `blockKinds`; the server-side `validateDocument`, which
  returns every problem of a document against its kind, the blocks and the depth and size bounds without throwing; and
  section-based themes with append-only revisions and rollback (`commitTheme`, `rollbackTheme`, `diffTheme`,
  `validateTheme`).
- 2787c1e: Add `@stackra/experience`: the `Block({ category, icon, accepts })` kind with `BlockCategory`, `LocalizedText` and
  `BlockProps`, the read-only `registeredBlocks()` the builder opens against, the L2 document format with its optional
  node `id` and its validator (`resolveDocument`, `UnknownBlockError`,
  `InvalidDocumentError`), the `Renderer` port, and the web and native `DocumentRenderer` with their `react` and `native`
  drivers.
- 903c2a5: Node renderer of studio documents (STA-1019, batch stackra-29). experience: new `./server` entry, the node renderer of studio documents. `renderEmailTemplate` draws an email
  template (email-safe blocks only) to HTML and a plain-text part; `renderPrintDocument` draws a print document and
  prints it to PDF through `@stackra/documents`' `PdfEngine`; `renderServerHtml` is the shared page render. Each checks
  the document against its kind first and throws `UnknownBlockError` or `InvalidDocumentError` before drawing. New
  types `ServerBlock`, `ServerBlockContext`, `ServerRenderOptions`, `PrintRenderOptions`, `RenderedEmail`,
  `RenderedPrint`. New dependency `@stackra/documents` (`./contracts` only; no cycle). builder: docs only, pointing previews and sends at `@stackra/experience/server`.
- a57a0df: Breaking rename (STA-1383): the section-based storefront theme is `SiteTheme`, so `Theme` means design tokens
  (`@stackra/tokens`) everywhere. `Theme`, `ThemeDiff`, `ThemeChange`, `ThemeRevision`, `commitTheme`, `diffTheme`,
  `rollbackTheme` and `validateTheme` of `@stackra/experience` are now `SiteTheme`, `SiteThemeDiff`, `SiteThemeChange`,
  `SiteThemeRevision`, `commitSiteTheme`, `diffSiteTheme`, `rollbackSiteTheme` and `validateSiteTheme`.
- 9310c51: One document-kind vocabulary and a unique block-node name (STA-1383).
  
  - `@stackra/experience/contracts`: `ExperienceKind` gains `Dashboard` (`dashboard`), after `ThemeSection`.
  - Breaking, `@stackra/panel`: `DocumentKind` is removed; `Document({ kind })` takes `ExperienceKind.Page` or
    `ExperienceKind.Dashboard` from `@stackra/experience/contracts` (same codes).
  - Breaking, `@stackra/panel`: the `BlockNode` type (a panel document's table, widget or custom block) is
    `PanelBlockNode`, so `BlockNode` is only experience's renderer component.
- 02ceb7e: One `LocalizedText`, in `@stackra/contracts` (a read-only record of strings per BCP 47 tag) (STA-1383). Breaking:
  `@stackra/experience` and `@stackra/brand-kit/contracts` no longer export their copies; import `LocalizedText` from
  `@stackra/contracts`. A brand kit's `name` and `line` are `LocalizedText & { readonly en: string }` (English still
  required).

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [dfa0c6a]
- Updated dependencies [6da76a2]
- Updated dependencies [a45aec8]
- Updated dependencies [281ec71]
- Updated dependencies [830898b]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [0a38324]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [2787c1e]
- Updated dependencies [9fa447e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9ab18b4]
- Updated dependencies [3b19f6d]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [1271b88]
- Updated dependencies [f04fec9]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [897ef24]
- Updated dependencies [9fa447e]
- Updated dependencies [5ae6115]
- Updated dependencies [d41fc93]
- Updated dependencies [9fa447e]
- Updated dependencies [d44e69c]
- Updated dependencies [9fa447e]
- Updated dependencies [b58ebce]
- Updated dependencies [3f2898c]
- Updated dependencies [9fa447e]
- Updated dependencies [69e90f1]
- Updated dependencies [9fa447e]
- Updated dependencies [1c29328]
- Updated dependencies [57f55b7]
- Updated dependencies [2e21e6a]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [e193feb]
- Updated dependencies [65da65c]
- Updated dependencies [65da65c]
- Updated dependencies [69e90f1]
- Updated dependencies [3f2898c]
- Updated dependencies [69e90f1]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/clients@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/documents@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
