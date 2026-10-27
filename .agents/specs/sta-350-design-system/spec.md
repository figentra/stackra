# Feature Specification: Stackra Design System: design-system category, `@stackra/tokens`, `@stackra/ui`, `apps/playground`

**Feature Branch**: `figentra/sta-350-design-system`

**Created**: 2026-10-23

**Status**: Implementing

**Linear**: STA-350

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Owner decisions of 2026-10-23, recorded in ADR 0302 in the same pull request. The umbrella name is "Stackra
Design System". Source decisions: ADR 0165 (web client stack, UI contract, form adapters), ADR 0128 (no Storybook), ADR
0227 (not built yet), ADR 0300 (presets), ADR 0024 (brand assets NOTICE), and the retired `@stackra/brand` package.

## Impact

- **Apps touched**: `apps/playground` (new), `apps/mobile` (brand imports become `@stackra/tokens`, app icons move in),
  `apps/docs` (ADR 0302, the logo and brand assets moved in, the regenerated `standards/structure.mdx`)
- **Services touched**: none
- **Packages touched**: `packages/design-system/tokens` (new, `@stackra/tokens`), `packages/design-system/ui` (new,
  `@stackra/ui`), `packages/design-system/icons` (new, `@stackra/icons`), `packages/experience/navigation` (new, `@stackra/navigation`, wave 6), `packages/experience/brand` (deleted, `@stackra/brand` retired), `packages/tooling/oxlint` (its boundary fixtures
  import `@stackra/tokens` instead of the retired brand package), `packages/tooling/typescript` (the `vite` preset also
  typechecks an app's `e2e/` folder)
- **Public contract change**: `@stackra/brand` is removed; `@stackra/tokens` (the token schema, the `stackra` theme and
  the two renderers) and `@stackra/ui` (shared contracts, `./react` and `./native` providers) are added. The
  `design-system` category joins the structure data, the validator and `pnpm new`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: yes, ADR 0302 (written by `docs-adr-steward` in this pull request; records the five owner decisions
  below); the amendment notes it adds to ADR 0165 and the brand records go in the same pull request
- **New dependencies**: a new `e2e` catalog (`@playwright/test` 1.64.1, `@axe-core/playwright` 4.14.0), approved by the
  owner on 2026-10-23; `react-aria-components` 1.22.1 in `catalog:frontend` (the version `@heroui/react` 3.2.6 resolves
  its peer to), approved by the owner on 2026-10-23 for `@stackra/ui/react`'s `I18nProvider`
- **Deploy modes**: none; two libraries and a dev-only app, the same for SaaS, on-prem and air-gapped
- **Licence tier**: the two packages are MIT; the brand assets stay under the ADR 0024 NOTICE in their new homes
- **UI surfaces**: `apps/playground` (the component workbench, not shipped to users)
- **Docs to update**: `apps/docs/src/docs/adr/0302-*.mdx` and its amendment notes, `apps/docs/src/docs/standards/structure.mdx`
  (regenerated), the package READMEs and the `design-system` category README, the roadmap
- **Lane**: lite (recorded reason: the lead chose lite because every decision was taken by the owner on 2026-10-23 and
  is recorded in ADR 0302 in the same pull request; the line count is over the lite guide because most of it is moved
  files)
- **Change risk**: R2 (new packages and a new member, a new dependency catalog, a UI surface)

## Decisions taken by the owner (2026-10-23)

1. **A `design-system` category** holds `packages/design-system/{tokens,ui}` and later `icons`; the umbrella name is
   "Stackra Design System".
2. **`@stackra/ui` is one API.** The contracts live in `src/contracts`; `./react` is built on HeroUI v3 and `./native`
   on HeroUI Native with Uniwind. The packages share the contract, not the component code (ADR 0165; the "shared React
   component library across web and native" row of ADR 0227 stays deferred). Form adapters live there (ADR 0165
   decision 2).
3. **`@stackra/brand` is retired.** Its tokens become the `stackra` theme in `@stackra/tokens` and the fonts move with
   the theme. Logos and brand assets move to `apps/docs`, and app icons to `apps/mobile`. A framework user brings their
   own brand as a theme.
4. **`apps/playground`** is a Vite and React Router app on HeroUI v3 with one route folder per component, a light/dark
   and LTR/RTL switcher, and Playwright with axe end-to-end tests in the app. It is not Storybook (ADR 0128, 0227).
5. **Working mode**: the setup pull request first; then the owner describes components one at a time.

## User Scenarios & Testing

### User Story 1 - Tokens as themes (Priority: P1)

A design-system builder defines a theme once, in the token schema, and gets the HeroUI v3 web variables and the
Uniwind / HeroUI Native theme from it.

**Independent Test**: unit tests over the `stackra` theme values and both renderers; each committed CSS file is compared
with the generator output.

**Acceptance Scenarios**:

1. **Given** the `stackra` theme, **When** the web renderer runs, **Then** it writes the light and dark HeroUI v3
   variables, and the committed CSS equals that output.
2. **Given** the same theme, **When** the native renderer runs, **Then** it writes the light and dark Uniwind theme and
   the committed CSS equals that output.

### User Story 2 - One UI API on web and native (Priority: P1)

An app builder wraps the app in the `@stackra/ui` provider for its platform and gets the theme and the text direction.

**Independent Test**: provider tests on `./react` (theme and direction reach the DOM) and on `./native`.

### User Story 3 - A playground and its e2e (Priority: P1)

A component builder opens `apps/playground`, switches theme and direction, and a Playwright and axe run proves every
route is accessible in all four combinations.

**Independent Test**: the e2e run in `apps/playground`.

### User Story 4 - `@stackra/brand` is gone (Priority: P2)

**Independent Test**: a repository search finds no reference to `@stackra/brand` outside ADRs and historical specs; the
moved assets exist in `apps/docs` and `apps/mobile`.

### Edge Cases

- **EC-01**: A theme that omits a dark variant fails the renderer with the missing token name; nothing is written.
- **EC-02**: A route folder with no matching switcher state is still rendered in all four combinations (the e2e loops
  over the route list, so a new route is covered without editing the test).

## Requirements

- **FR-001**: `@stackra/tokens` SHALL export, from `src/contracts`, the token schema types: a theme, its colour,
  typography, radius, spacing and font tokens, with a light and a dark variant.
- **FR-002**: `@stackra/tokens` SHALL carry the `stackra` theme with token values identical to the retired
  `@stackra/brand` tokens, its fonts moving with it.
- **FR-003**: `@stackra/tokens` SHALL render a theme to HeroUI v3 web CSS variables for light and dark, and the
  committed CSS SHALL equal the generator output.
- **FR-004**: `@stackra/tokens` SHALL render a theme to the Uniwind and HeroUI Native theme for light and dark, and the
  committed CSS SHALL equal the generator output.
- **FR-005**: `@stackra/brand` SHALL be retired: the package is deleted, no reference to it remains outside ADRs and
  historical specs, logos and brand assets live in `apps/docs`, and app icons live in `apps/mobile`.
- **FR-006**: The `design-system` category SHALL exist in `structure.mjs`, `validate-repository.mjs` and the `pnpm new`
  scaffold.
- **FR-007**: `@stackra/ui` SHALL export, from `src/contracts`, the shared types (size, colour or tone, variant, colour
  scheme, direction) and the provider contract.
- **FR-008**: `@stackra/ui/react` SHALL provide the provider wiring on HeroUI v3: the theme and the direction and
  locale.
- **FR-009**: `@stackra/ui/native` SHALL provide the provider wiring on HeroUI Native with Uniwind.
- **FR-010**: `apps/playground` SHALL offer a theme and direction switcher and one route folder per component, the
  first route being the token foundations page.
- **FR-011**: The playground SHALL have a Playwright and axe end-to-end test over every route in light, dark, LTR and
  RTL.

Wave 1 of the components (ADR 0303; Linear STA-353 to STA-357). Icon, then Text and Heading; Button and Link follow in
their own requirements. The ids continue this list; the wave-1 design briefs numbered each group from 001.

- **FR-012**: `@stackra/ui` SHALL export `IconContractProps`, `IconComponent` and `IconComponentProps` from
  `./contracts`, `ICON_SIZES` from `.`, and an `Icon` from `./react` (lucide-react) and `./native`
  (lucide-react-native) that draws any Lucide icon component, or any component with the same props, at `sm` 16, `md`
  20 or `lg` 24 px and in the colour role of a text tone.
- **FR-013**: An `Icon` without a label SHALL be hidden from assistive technology on both runtimes; with a label it
  SHALL be exposed as an image named by the label (web `role="img"` and `aria-label`; native `accessible`,
  `role="img"` and `accessibilityLabel`).
- **FR-014**: An `Icon` with `isMirroredInRtl` SHALL be drawn mirrored when the direction is right-to-left and
  unmirrored otherwise; an icon without it is never mirrored.
- **FR-015**: Icon slots of `@stackra/ui` components SHALL accept any React element; the native
  `DesignSystemProvider` SHALL give Lucide icons the `md` size and the theme foreground by default, which a native host
  overrides through `LucideProvider`.
- **FR-016**: The playground SHALL have an icon route showing every size, tone, decorative and labelled use, the
  mirrored and never-mirrored directional icons, an app-supplied icon component and a live sample, with e2e checks for
  names, mirroring and 3:1 non-text contrast in light, dark, LTR and RTL.
- **FR-017**: `@stackra/ui/contracts` SHALL export `TextType`, `HeadingType`, `HeadingLevel`, `TextTone`, `TextAlign`,
  `TypographyContractProps`, `TextContractProps` and `HeadingContractProps`.
- **FR-018**: `@stackra/ui/react` SHALL export `Text` and `Heading` on HeroUI v3 Typography implementing the
  contracts; `Heading` renders `h<level>`.
- **FR-019**: `@stackra/ui/native` SHALL export `Text` and `Heading` on HeroUI Native Typography implementing the same
  contracts.
- **FR-020**: The `stackra` theme SHALL define `h4` to `h6` and their `-ar` twins (ADR 0303 decision 9), and the
  `@stackra/tokens` web and native stylesheets SHALL draw HeroUI's Typography types in the theme's type scale, with
  the `-ar` styles for Arabic text.
- **FR-021**: The playground SHALL have a typography route showing every Text type, Heading level and type, tone,
  alignment, truncation and language case, and a live sample, in light, dark, LTR and RTL, and it SHALL group its
  pages by category in the navigation and on the index.
- **FR-022**: `@stackra/ui/contracts` SHALL export `ButtonVariant`, `ButtonContractProps`, `IconButtonContractProps`
  and `CloseButtonContractProps`, and `@stackra/ui/react` SHALL export `Button`, `IconButton` and `CloseButton` on
  HeroUI v3 implementing them: `variant`, `size`, `isDisabled`, `isLoading`, `isFullWidth`, `startIcon`, `endIcon`,
  `label` and `onPress`, with every other HeroUI prop passed through and HeroUI's own names for the renamed concepts
  refused by the type.
- **FR-023**: `@stackra/ui/native` SHALL export `Button`, `IconButton` and `CloseButton` on HeroUI Native implementing
  the same contracts, with HeroUI Native's press feedback (`feedbackVariant`, `animation`, `background`) passed
  through.
- **FR-024**: A loading `Button` SHALL refuse presses, keep focus on web under an unchanged accessible name with a
  hidden spinner, and report `busy` with a spinner in the label colour on native; `IconButton` and `CloseButton`
  SHALL always have a non-empty accessible name, and the type SHALL refuse a missing `label`.
- **FR-025**: `@stackra/ui/contracts` SHALL export `LinkUnderline` and `LinkContractProps`, and `./react` (HeroUI v3
  `Link`) and `./native` (HeroUI Native `LinkButton`) SHALL export a `Link` that maps `tone`, `underline` (default
  `always`), `isExternal`, `label` and `isDisabled`, passing every other HeroUI prop through.
- **FR-026**: `Link` SHALL be router-free: on web an internal, same-origin, unmodified click SHALL navigate through
  React Aria's `RouterProvider`, which `./react` re-exports; on native an app path SHALL navigate through the
  `./native` `RouterProvider`, and an absolute URL or an external link SHALL open in the system browser.
- **FR-027**: The playground SHALL have `/button`, `/icon-button` and `/close-button` routes showing every variant,
  size and state with an interactive example each, listed under the Actions category, in light, dark, LTR and RTL.
- **FR-028**: The playground SHALL have a `/link` route showing every tone, underline, external, disabled, press-only
  and icon-only link, inline in text and standalone, listed under the Navigation category, and its shell and index
  SHALL use the `@stackra/ui` `Link` and `RouterProvider`.

Wave 2 of the components (ADR 0304; Linear STA-358 to STA-360), part 1: Surface, Card and Separator, Chip and
StatusBadge, and Badge. The ids continue this list.

- **FR-029**: `@stackra/ui/contracts` SHALL export `SurfaceVariant`, `SeparatorVariant`, `Orientation`,
  `SurfaceContractProps`, `CardContractProps`, `CardTitleContractProps` and `SeparatorContractProps`.
- **FR-030**: `@stackra/ui/react` SHALL export `Surface`, `Card` (with `Header`, `Title`, `Description`, `Content` and
  `Footer`) and `Separator` on HeroUI v3 implementing the contracts, with every other HeroUI prop passed through.
- **FR-031**: `@stackra/ui/native` SHALL export the same three on HeroUI Native with the same part names (`Card.Content`
  is HeroUI Native's `Card.Body`), the native `Separator` drawing its level with the theme colour.
- **FR-032**: The playground SHALL have `/surface`, `/card` and `/separator` routes showing every level, part,
  orientation and title level with an interactive example each, listed under the Surfaces category, in light, dark,
  LTR and RTL, with an e2e file each.
- **FR-033**: `@stackra/ui/contracts` SHALL export `ChipVariant`, `ChipContractProps` and `StatusBadgeContractProps`.
- **FR-034**: `@stackra/ui/react` SHALL export `Chip` on HeroUI v3 Chip and `StatusBadge` built on it, implementing the
  contracts; a chip is display only and takes no press handler.
- **FR-035**: `@stackra/ui/native` SHALL export `Chip` on HeroUI Native Chip and `StatusBadge` built on it,
  implementing the same contracts.
- **FR-036**: The playground SHALL have `/chip` and `/status-badge` routes showing every variant, tone and size, icons
  and every status tone with an interactive example each, listed under the Status category, in light, dark, LTR and
  RTL, with an e2e file each.
- **FR-037**: `@stackra/ui/contracts` SHALL export `BadgeVariant`, `BadgePlacement`, `BadgeContractProps` and
  `BadgeAnchorContractProps`.
- **FR-038**: `@stackra/ui/react` SHALL export `Badge` with `Badge.Anchor` on HeroUI v3's Badge implementing the
  contracts, its logical `placement` mapped to HeroUI's physical corner by the text direction.
- **FR-039**: `@stackra/ui/native` SHALL export `Badge` with `Badge.Anchor` implementing the same contracts in the
  documented adapted form: a HeroUI Native Chip at the web Badge's sizes, absolutely placed with React Native's logical
  sides in a relative View.
- **FR-040**: The playground SHALL have a `/badge` route showing every variant, tone, size, corner, a dot, text, number
  and icon content, and a badge on a pressable control, listed under the Status category, in light, dark, LTR and RTL,
  with an e2e file.

Wave 2 of the components, part 2 (ADR 0304; Linear STA-361, STA-363, STA-362): Avatar, Spinner, and Skeleton with
SkeletonGroup. The ids continue this list.

- **FR-041**: `@stackra/ui/contracts` SHALL export `AvatarVariant`, `AvatarShape`, `AvatarContractProps`,
  `SpinnerContractProps`, `SkeletonAnimation`, `SkeletonContractProps` and `SkeletonGroupContractProps`, and
  `@stackra/ui` SHALL export `initialsOf`.
- **FR-042**: `@stackra/ui/react` SHALL export `Avatar` and `Spinner` on HeroUI v3, `Skeleton` on HeroUI v3 and
  `SkeletonGroup` in its documented adapted form (HeroUI's single shimmer plus a context), implementing the contracts,
  with every other HeroUI prop passed through.
- **FR-043**: `@stackra/ui/native` SHALL export `Avatar`, `Spinner`, `Skeleton` and `SkeletonGroup` on HeroUI Native
  implementing the same contracts, the motion config (`animation`) passing through.
- **FR-044**: `initialsOf` SHALL return the first letter of the first and last words, upper-cased in the locale, one
  letter for an Arabic-script name and an empty string for a blank name.
- **FR-045**: The `@stackra/tokens` web stylesheet SHALL stop every skeleton animation under `prefers-reduced-motion:
reduce` and run the skeleton sweep from the inline-start side in right-to-left documents.
- **FR-046**: The playground SHALL have `/avatar`, `/spinner` and `/skeleton` routes showing every size, tone,
  variant, shape, animation, fallback, name and state with an interactive example each, listed under the Status
  category, in light, dark, LTR and RTL, with an e2e file each.

The icon model (ADR 0303 decision 10; Linear STA-405, branch `figentra/sta-353-wave-1-components`): the `@stackra/icons`
package and the name-based `Icon`. The ids continue this list.

- **FR-047**: `@stackra/icons/contracts` SHALL export `IconName`, a string type that is a Lucide name from the pinned
  set (`LucideIconName`), a Stackra alias (`IconAlias`) or a namespaced custom name (`CustomIconName`, the template
  type `${string}::${string}`), and SHALL export `IconComponent`, `IconComponentProps` and `IconRegistry`; `IconComponentProps` SHALL name every
  prop `Icon` hands a component (size, colour, stroke width, class, style, and the web and native accessibility props),
  so a custom component can be written to spread them.
- **FR-048**: The `LucideIconName` list SHALL be generated by `scripts/generate-icons.mjs` from the installed
  `lucide-react` and `lucide-react-native` packages and committed, and a unit test SHALL fail when it differs from
  the names those packages ship, or when a generated registry or re-export file names an icon that is not in it.
- **FR-049**: `@stackra/icons` SHALL export `defineIconRegistry`, `findIcon`, `isIconName` and `ICON_ALIAS_TARGETS`:
  `findIcon` SHALL return the registry's component for a name, or for the Lucide name an alias resolves to, reading
  own properties only; `isIconName` SHALL be true for a Lucide name, an alias and a well-formed custom name and false
  for anything else; every alias SHALL resolve to a Lucide name and SHALL not itself be one.
- **FR-050**: `@stackra/icons/react` and `@stackra/icons/native` SHALL each export `IconRegistryProvider` and `useIcon`:
  a provider gives the icons below it their registry, providers nest and merge with the nearest winning, and a name
  outside every registry resolves to nothing without throwing.
- **FR-051**: `@stackra/icons/react/lucide-icons` and `@stackra/icons/native/lucide-icons` SHALL re-export every
  Lucide component by its own name, and `@stackra/icons/react/lucide-registry` and
  `@stackra/icons/native/lucide-registry` SHALL hold the full name-to-component registry as an explicit opt-in that
  no other entry imports, so the full set is bundled only by an app that asks for it.
- **FR-052**: `Icon` in `@stackra/ui/react` and `@stackra/ui/native` SHALL take `name: IconName` and no component
  prop, resolve it through the registry of `@stackra/icons` for its platform, and draw nothing for a name that has
  no registered component, warning once per name in development.
- **FR-053**: The icon slots `icon`, `startIcon` and `endIcon` of Button, IconButton, CloseButton and Chip SHALL
  accept an `IconName`, drawn through `Icon`, or an element, drawn as given.
- **FR-054**: No file outside `@stackra/icons` and `@stackra/ui` SHALL import `lucide-react` or `lucide-react-native`,
  and the playground SHALL register only the icons it draws.

Wave 3 foundation (ADR 0303; Linear STA-364 to STA-369): the field contract, playground discovery and the form-state
dependency the inputs and forms build on. The ids continue this list; the wave 3 components take FR-058 onwards.

- **FR-055**: `@stackra/ui/contracts` SHALL export `FieldContractProps<TValue>`, the props shared by every field:
  `label`, `description`, `errorMessage`, `isRequired`, `isInvalid`, `isDisabled`, `isReadOnly`, `value`,
  `defaultValue`, `onChange(value)` and `name`, so TextField, TextArea, SearchField, the number input, Select,
  ComboBox and the Checkbox, RadioGroup and Switch family extend one type — verified by: typecheck
- **FR-056**: The playground SHALL build its router, its index page and its shell navigation from the route folders
  alone: every `routes/<name>/<name>.route.ts` that names a category is paired with `routes/<name>/<name>.tsx`,
  listed under that category in the category order and then by title, and a wrong path, an unknown category or a
  missing page SHALL fail the build of the page list with the folder's name; the index route, which names no
  category, SHALL stay unlisted — verified by: unit
- **FR-057**: `react-hook-form` SHALL be in `catalogs.frontend` at an exact version at least 14 days old, and
  `@stackra/ui` SHALL declare it as a required peer and a dev dependency, because `./react` and `./native` both
  export `FormField`, which imports it — verified by: pnpm validate
- **FR-058**: `FormField` in `@stackra/ui/react` and `@stackra/ui/native` SHALL wrap react-hook-form's `Controller`
  (`control`, `name`, `rules`, `defaultValue`, `disabled`, `shouldUnregister`) and call `render` with a
  `FormFieldBinding<TValue>` typed to the field's path: `name`, `value`, `onChange`, `onBlur`, `isInvalid`,
  `errorMessage`, `isRequired` and `isDisabled`, a slice of `FieldContractProps` that every field accepts; the Zod
  resolver is not part of it — verified by: unit, typecheck
- **FR-059**: A bound field SHALL show its rule's message under it after a failed submit and mark itself invalid,
  clear both once its value is valid, be required when its `required` rule is (`true`, a message or an object whose
  `value` is true), be disabled when the form disables it, mark itself touched on blur, and bind a string, a boolean
  and a choice; on web the form sets `validationBehavior="aria"` so the browser does not block the submit — verified
  by: unit, e2e
- **FR-060**: `FormSection` in `@stackra/ui/react` SHALL be a HeroUI `Fieldset` named by its required `title` as
  its `legend`, tie an optional `description` to the group with `aria-describedby`, hold its fields in the fieldset's
  field group, and pass `disabled`, `className`, `id` and every other fieldset prop through, a disabled section
  disabling the fields inside it — verified by: unit, e2e
- **FR-061**: `FormSection` in `@stackra/ui/native` SHALL be the documented adapted form on free parts, a `View` with
  the `group` role named by a string `title`, holding a level-3 `Heading` in the `h5` style, an optional `Description`
  and the fields, with `View` props passed through — verified by: unit
- **FR-062**: The playground SHALL have a `/form-field` and a `/form-section` route under Forms, each with one `h1` and
  a per-route title, showing the states and one live example: a react-hook-form form with failed and valid submits,
  a simulated server rejection and reset, and a form whose switch disables a section — verified by: unit
- **FR-063**: `TextField` in `@stackra/ui/contracts` SHALL extend `FieldContractProps<string>` with `type`
  (`TextFieldType`: text, email, password, tel, url), `placeholder`, `variant` (`TextFieldVariant`: primary the
  default, secondary) and `isFullWidth` (default true); a description is read with the input, an error message shows
  only while the field is invalid, and `fullWidth` and `children` are refused — verified by: unit, typecheck
- **FR-064**: `TextField` in `@stackra/ui/react` SHALL wrap HeroUI's `TextField` with its label, input, description
  and error message, name the input by its label, keep its own text when uncontrolled, report each change as a string,
  submit under its `name`, and pass unknown props and the caller's class to the root; the `/text-field` playground
  route SHALL show every state with axe clean in the four theme and direction combinations — verified by: unit, e2e
- **FR-065**: `TextField` in `@stackra/ui/native` SHALL draw the label, the input, the description and the error in
  that order on HeroUI Native, hide the description while invalid as web does, mask a password and ask for the email
  and phone keyboards, and keep `name` off the input — verified by: unit
- **FR-066**: `TextArea` in `@stackra/ui/contracts` SHALL be the `TextField` contract without `type` and with `rows`,
  the number of lines shown — verified by: unit, typecheck
- **FR-067**: `TextArea` in `@stackra/ui/react` SHALL be a HeroUI text area named by its label with its description
  tied to it, keep Enter for a new line, and the `/text-area` playground route SHALL show every state with axe clean
  in the four combinations — verified by: unit, e2e
- **FR-068**: `TextArea` in `@stackra/ui/native` SHALL be a multi-line HeroUI Native input with the label,
  description and error of `TextField` — verified by: unit
- **FR-069**: `InputGroup` in `@stackra/ui/contracts` SHALL extend the `TextField` contract with a `prefix` and a
  `suffix`, each a string or an element — verified by: unit, typecheck
- **FR-070**: `InputGroup` in `@stackra/ui/react` SHALL draw the prefix, the input and the suffix in that order
  inside one HeroUI group that takes the invalid and disabled states, focus the input when a text affix is pressed,
  and sit the affixes at the reading sides in LTR and RTL — verified by: unit, e2e
- **FR-071**: `InputGroup` in `@stackra/ui/native` SHALL draw the same parts on HeroUI Native, the affixes at the
  reading sides — verified by: unit
- **FR-072**: `SearchField` in `@stackra/ui/contracts` SHALL extend `FieldContractProps<string>` with `placeholder`,
  `variant`, `isFullWidth`, `isLoading`, `clearLabel` (default "Clear search"), `onClear` and `onSubmit` —
  verified by: unit, typecheck
- **FR-073**: `SearchField` SHALL, on web (HeroUI `SearchField`) and on native (HeroUI Native `SearchField`, held
  uncontrolled by the wrapper), report each change with the new text, clear through a button named by `clearLabel`
  and call `onClear`, call `onSubmit` on Enter, and show a busy state while loading — verified by: unit
- **FR-074**: The `/search-field` playground route SHALL show every state with a live filtered list and axe clean in
  the four combinations, a keyboard-only flow and the search icon at the reading start — verified by: e2e
- **FR-075**: `Select` in `@stackra/ui/contracts` SHALL extend `FieldContractProps<string | null>` with `items`
  (`SelectItem`: id, label, description, isDisabled), `placeholder` and `isFullWidth`, and pass unknown HeroUI props
  through, on web and native — verified by: unit, typecheck
- **FR-076**: `Select` SHALL call `onChange` with the key as a string, or null for nothing, and a read-only `Select`
  SHALL show its value and never open — verified by: unit
- **FR-077**: `ComboBox` in `@stackra/ui/contracts` SHALL take `items`, `placeholder`, `isFullWidth`, `inputValue` and
  `onInputChange`, `isServerFiltered`, `isLoading` with `loadingLabel`, `onLoadMore` and `emptyMessage`, with
  `selectionMode` single (value a string or null) or multiple (value a readonly string list), on web and native —
  verified by: unit, typecheck
- **FR-078**: `ComboBox` SHALL filter by the label of each item unless `isServerFiltered` is set, and SHALL show
  `emptyMessage` when nothing matches — verified by: unit
- **FR-079**: `ComboBox` in multiple mode SHALL show the picked items as removable tags with an accessible name on
  web, and the adapted form on free HeroUI Native parts that the native file header documents — verified by: unit
- **FR-080**: `TagGroup` SHALL take `items` (`TagItem`), `selectionMode` none, single or multiple, `size`, `variant`
  (`TagVariant`: default, surface), `emptyMessage`, and `onRemove` together with `removeLabel` as one required pair,
  on web and native — verified by: unit, typecheck
- **FR-081**: The `/select`, `/combo-box` and `/tag-group` playground routes (category Selection) SHALL show every
  variant, size and state with one interactive example and a single `h1`, with axe clean in the four combinations
  and the keyboard and accessible names checked — verified by: unit, e2e
- **FR-082**: `Checkbox`, `CheckboxGroup`, `RadioGroup` and `Switch` SHALL extend `FieldContractProps`, `Checkbox`
  and `Switch` over a boolean mapped to HeroUI's `isSelected`, `CheckboxGroup` over a readonly list of keys and
  `RadioGroup` over one key, each option of a group being a `ChoiceOption` (value, label, description, isDisabled)
  — verified by: unit, typecheck
- **FR-083**: Each of the four SHALL keep its own state when given `defaultValue`, show `value` when controlled and
  report each change with the new state or key list — verified by: unit
- **FR-084**: `CheckboxGroup` SHALL be a group named by its label with one checkbox per option in order, on web as
  HeroUI's `CheckboxGroup` and on native as a `role="group"` `View` of native checkboxes on free parts, which the
  native file header documents — verified by: unit
- **FR-085**: `RadioGroup` SHALL be a radio group with one radio per option in order, vertical by default and
  horizontal on request, each option's description read with that option — verified by: unit
- **FR-086**: A group's description and error message SHALL be tied to the group for assistive technology, the
  error showing only while invalid, and a required field SHALL be marked in its label and for assistive
  technology — verified by: unit
- **FR-087**: A disabled field SHALL refuse input, a read-only one SHALL keep focus and refuse change, an option
  disabled on its own SHALL leave the others usable, and a field SHALL submit under its `name` in a form —
  verified by: unit
- **FR-088**: The native `Checkbox` and `Switch` SHALL be the adapted form on `ControlField`, with documented
  adaptations for the mixed state, read-only and `name` — verified by: unit
- **FR-089**: The `/checkbox`, `/checkbox-group`, `/radio-group` and `/switch` playground routes SHALL show every
  state, with axe clean in the four combinations, a Space-key toggle, the control at the reading start and a checked
  control 3:1 from the page — verified by: e2e
- **FR-090**: `Label` in `@stackra/ui/react` and `@stackra/ui/native` SHALL name the control it is tied to, draw the
  required marker and take the invalid and disabled states only when given them — verified by: unit
- **FR-091**: `Description` SHALL render help text with HeroUI's class and keep the id a control names it by in
  `aria-describedby` — verified by: unit
- **FR-092**: `FieldError` SHALL show its message while `isInvalid` is true, follow the field around it when
  `isInvalid` is left out, tie the message to that field, and let a caller's `isInvalid` win — verified by: unit
- **FR-093**: `Form` SHALL be a form element on web that hands `validationErrors` to the fields in it and, with
  `isSubmitOnModEnter`, submits on Cmd or Ctrl plus Enter while Enter alone does not submit from a single-line input
  and Enter during text composition is ignored; on native it SHALL be the adapted form, a `View` — verified by: unit
- **FR-094**: The `/form` playground route SHALL show the parts together, with axe clean in the four combinations,
  focus moved to a refused field with its error read out, and the keyboard rules of `Form` — verified by: unit, e2e

- **FR-095**: The native `DesignSystemProvider` SHALL set React Native's `Appearance` to the colour scheme (`unspecified`
  for `system`) so native chrome follows it and give the device's style back on unmount, and SHALL lay its subtree out
  in a `flex: 1` View whose Yoga `direction` is the resolved direction, because Uniwind's `LayoutDirection` is
  `display: contents` and never reaches the layout — verified by: unit, device check on `apps/mobile`

- **FR-096**: `@stackra/ui/contracts` SHALL hold the props every wave 4 overlay and message shares, each optional so a
  component adds only what it needs: `OpenStateContractProps` (`isOpen`, `defaultOpen`, `onOpenChange`),
  `OverlayContractProps` (the open state plus `isDismissable` and `isKeyboardDismissDisabled`), `PlacementContractProps`
  (`placement`, a `Placement` side by reading direction, and `align`, a `PlacementAlign`) and `FeedbackContractProps`
  (`tone`, a `Tone`, and `icon`, an `IconSlot` or `false`), and the internal `FEEDBACK_BY_TONE` SHALL give every tone a
  default icon and a live-region role, `alert` only for warning and danger — verified by: unit, typecheck
- **FR-097**: `reactAriaPlacementOf` SHALL turn a side and an alignment into the placement string React Aria accepts
  (the side alone when centred, and `start` and `end` read as top and bottom on a start or end side), and
  `physicalSideOf` SHALL turn a logical side into HeroUI Native's `left` or `right` by text direction, leaving `top`
  and `bottom` alone — verified by: unit, typecheck

- **FR-098**: `@stackra/ui/contracts` SHALL hold `ModalContractProps` (`size` of `sm`, `md`, `lg` or `full`, and `position`
  of `auto`, `top`, `center` or `bottom`), `DrawerContractProps` (`placement`, a `Placement` side) and
  `OverlayTitleContractProps` (`level`), each on the shared overlay props with `trigger`, `label` and `children`, and
  every `Close` part SHALL take the `CloseButton` contract, whose `label` is required — verified by: unit, typecheck
- **FR-099**: On web, `Modal` and `Drawer` SHALL be one root with `Header`, `Title`, `Body`, `Footer` and `Close` parts
  on HeroUI v3, open from a `trigger` or by `isOpen` and `onOpenChange`, named by the `Title` (placed in the outline
  by `level`), dismissed by Escape and a press outside unless `isKeyboardDismissDisabled` or `isDismissable` turns it
  off, with the Drawer's `start` and `end` placements mapped to the physical edge HeroUI lays out, so they mirror in
  right-to-left once — verified by: unit
- **FR-100**: On native, `Modal` SHALL be the HeroUI Native Dialog and `Drawer` the adapted form on its BottomSheet (a
  phone has no side panel, so `placement` is `bottom`), with the same parts and props, string children wrapped in
  `Text`, `isDismissable` mapped to a press outside and the swipe, and the Android back button swallowed only with
  `isKeyboardDismissDisabled` — verified by: unit, device check on `apps/mobile`
- **FR-101**: The `/modal` and `/drawer` playground routes SHALL show every size, position and placement, a controlled
  example and the open state reported, and focus SHALL return to the trigger on close — verified by: unit, e2e
- **FR-102**: `AlertDialog` SHALL ask one decision as an `alertdialog` named by its title and described by its
  description, with the tone's icon, a confirm and a cancel button, `onConfirm` and `onCancel`, `isConfirmDisabled`,
  focus starting on cancel on web (on native cancel comes first in reading order, as native moves no focus),
  `isDismissable` false by default, and Escape or the Android back button cancelling unless
  `isKeyboardDismissDisabled` is set, on web (HeroUI AlertDialog) and on native (the adapted form on Dialog) —
  verified by: unit
- **FR-103**: `useConfirmation()` SHALL return `confirm(options): Promise<boolean>` backed by the one `AlertDialog` a
  `ConfirmationProvider` renders, resolving true on confirm and false on cancel, Escape or a newer question, and a
  question with `confirmationText` SHALL keep confirm disabled until that text is typed — verified by: unit
- **FR-104**: `LeaveConfirmation` SHALL guard unsaved work: while `when` is true the browser asks before the tab closes
  or reloads, and `confirmLeave()` on its `ref` asks the question through an `AlertDialog`, resolving true at once
  while `when` is false, true on discard and false on stay, with no router import — verified by: unit
- **FR-105**: The `/alert-dialog`, `/use-confirmation` and `/leave-confirmation` playground routes SHALL show each
  tone, the answer as it happens and the keyboard path, with the tone icons drawn from the kit's own registry, and axe
  SHALL report nothing — verified by: unit, e2e
- **FR-106**: `@stackra/ui/contracts` SHALL hold `MenuContractProps` (`sections`, `selectionMode`, `value`,
  `defaultValue`, `onChange`, `onAction`, on the open state and placement props), `MenuSection`, `MenuItem` (a submenu one
  level deep) and `MenuLeafItem`, and `ActionMenuContractProps` (`label`, `icon`, `variant`, `size`, `isDisabled`),
  and `mergeSectionSelection` SHALL keep one choice per section in single mode and any number in multiple mode over
  one flat list of keys — verified by: unit, typecheck
- **FR-107**: `Menu` SHALL show its sections with a divider between them, each action with its icon, label, second
  line, danger tone and disabled reason, and web also its shortcut hint, open from its one trigger child, call
  `onAction` and `onPress`, scope selection to a section, and open a submenu on the arrow keys on web — verified by:
  unit
- **FR-108**: `ActionMenu` SHALL be an `IconButton` named by its required `label` that opens a `Menu`, at the reading end
  by default, without letting a choice reach the row around the button — verified by: unit
- **FR-109**: The `/menu` and `/action-menu` playground routes SHALL show grouped, selectable, danger, disabled and
  submenu examples, and each choice SHALL be reported — verified by: unit, e2e
- **FR-110**: `Popover` SHALL open its content from its trigger with an optional `title` and arrow, place it by
  `placement` and `align` (a physical side by reading direction on native), close on Escape on web and on a press
  outside unless `isDismissable` is false, and name the dialog by `aria-label` or `title` — verified by: unit, e2e
- **FR-111**: `Tooltip` SHALL describe the element it wraps and never name it, on web showing on hover and keyboard
  focus only, hiding on Escape and staying while the pointer is over it, and on native being the adapted form that
  speaks the text as the element's accessibility hint — verified by: unit, e2e
- **FR-112**: `Alert` and `toast()` SHALL take a `tone`, a title or message, an optional description and an icon
  (the tone's own, the caller's, or `false`), and SHALL announce by tone: `alert` and assertive for warning and
  danger, `status` and polite for the rest, set by the component and never by the caller — verified by: unit
- **FR-113**: On web, `Alert` SHALL be HeroUI v3's Alert with a wrapping row for `actions`, and `toast()` SHALL show a
  message on HeroUI v3's queue through a mounted `ToastProvider`, with `success`, `warning`, `danger` and `info`,
  `close(id)` and `clear()`, an action that runs and then closes the toast, a timeout (0 keeps it) and a named
  dismiss button — verified by: unit
- **FR-114**: On native, `Alert` SHALL be an adapted form on views, and `toast()` the same call through HeroUI
  Native's toast manager and a mounted `ToastProvider`, with a persistent toast for a timeout of 0 and a named
  dismiss button beside the swipe — verified by: unit
- **FR-115**: `liveRegionOf` SHALL turn a tone into its live-region role and `aria-live` value, `alert` and `assertive`
  for warning and danger, `status` and `polite` for the others — verified by: unit
- **FR-116**: The `/alert` and `/toast` playground routes SHALL show every tone, with and without a description,
  actions and icon, and axe SHALL report nothing — verified by: unit, e2e
- **FR-117**: `@stackra/ui/contracts` SHALL hold `ProgressContractProps` (`value`, `minValue`, `maxValue`, `size`,
  `tone`, a required `label`, `valueLabel`), `ProgressBarContractProps` and `ProgressCircleContractProps`, a missing
  `value` meaning indeterminate, and `progressStateOf` SHALL hold a value inside its range and give the fill, the
  text in the reader's locale and the accessibility value, all unknown while the value is — verified by: unit,
  typecheck
- **FR-118**: On web, `ProgressBar` and `ProgressCircle` SHALL be HeroUI v3's, named by `label`, determinate or
  indeterminate by `value`, showing the label and value text when asked — verified by: unit
- **FR-119**: On native, `ProgressBar` and `ProgressCircle` SHALL be the adapted forms (views, and `react-native-svg`,
  with `react-native-reanimated`), one `progressbar` with its range and text, busy while indeterminate, starting
  from the inline start, and still under reduced motion — verified by: unit, device check on `apps/mobile`
- **FR-120**: The `/progress-bar` and `/progress-circle` playground routes SHALL show determinate, indeterminate,
  every tone and size, and an advance-and-reset example that announces its completion, and axe SHALL report
  nothing — verified by: unit, e2e

- **FR-121**: `@stackra/ui/contracts` SHALL hold the props every wave 5 collection shares: `CollectionContractProps`
  (`items` of a `CollectionItem` with a string `id`, `emptyState`, `isLoading` and `loadingLabel`),
  `SelectionContractProps` (`selectionMode`, and `selectedKeys`, `defaultSelectedKeys` and `onSelectionChange` as lists
  of string ids, never a `Set`) and `SortDescriptor` (a column `id` and a `SortDirection`, `ascending` or
  `descending`), each optional but `items` — verified by: unit, typecheck
- **FR-122**: `keysOfSelection` SHALL turn a React Aria or HeroUI Native selection into a list of ids (`"all"` becomes
  every id, a `Set` follows the items' order), and `nextSortDescriptor` SHALL start an unsorted column ascending and
  flip an ascending one to descending — verified by: unit, typecheck
- **FR-123**: On web, `Table` SHALL be HeroUI v3's, named by the required `label`, with `columns` and a `renderCell`
  (a cell with none showing the row property its column's `id` names through `cellTextOf`), a checkbox column for
  `multiple` selection, a row selected on press for `single`, sorting by `sortDescriptor` and `onSortChange` through
  `nextSortDescriptor`, and loading by `isLoading` and `onLoadMore`, with one polite status message — verified by: unit
- **FR-124**: On native, `Table` SHALL be the adapted form (ADR 0313 decision 7): a `FlatList` of cards with a sort
  chooser in its header, selecting rows as checked radios or checkboxes, and no select-all — verified by: unit,
  device check on `apps/mobile`
- **FR-125**: The `/table` playground route SHALL show sorting, single and multiple selection, an empty and a loading
  table and load more, and axe SHALL report nothing — verified by: unit, e2e
- **FR-126**: `@stackra/ui/contracts` SHALL hold `ListContractProps`, `ListItemContractProps` and `ListItemData`
  (`title`, `description`, `startIcon`, `endContent`, `hasChevron`, `onPress`, `isDisabled`) on the collection and
  selection props — verified by: unit, typecheck
- **FR-127**: On web, `List` and `ListItem` SHALL be a plain `ul` of rows without a selection mode, with a pressable
  row a full-width HeroUI button, and a HeroUI `ListBox` with a checkmark when a selection mode is given — verified
  by: unit
- **FR-128**: Every `List` SHALL show its `emptyState` only when there are no items and nothing loads, be busy with one
  named spinner while it loads, report its selection as ids in the items' order, and call `onLoadMore` when its end
  is reached while `hasMore` is true — verified by: unit
- **FR-129**: On native, `List` SHALL be a `FlatList` inside HeroUI Native's `ListGroup`, selecting rows as radios or
  checkboxes with a check mark, and `onLoadMore` going to `onEndReached` — verified by: unit
- **FR-130**: The `/list` playground route SHALL show plain, pressable, selecting, empty and loading lists, and axe
  SHALL report nothing — verified by: unit, e2e
- **FR-131**: `@stackra/ui/contracts` SHALL hold `PropertyListContractProps` and `PropertyListItem` (`label`, `value`,
  `copyLabel`, `copyValue`), and `copyTextOf` SHALL decide a row is copyable only with a `copyLabel` and some text —
  verified by: unit, typecheck
- **FR-132**: On web, `PropertyList` SHALL be the adapted form (a `dl` of `dt` and `dd` rows, HeroUI has none), show
  `emptyValue` for a missing, empty or false value and not for `0`, stack two columns on narrow screens, and copy
  to the clipboard with a check mark and a polite announcement — verified by: unit
- **FR-133**: On native, `PropertyList` SHALL be a `list` of `listitem` views with the same empty-value rule, and a
  copy button that calls `onCopy` with the text — verified by: unit
- **FR-134**: The `/property-list` playground route SHALL show one and two columns, empty values and copying, and axe
  SHALL report nothing — verified by: unit, e2e
- **FR-135**: `@stackra/ui/contracts` SHALL hold `TabsContractProps` and `TabItem`; on web, `Tabs` SHALL be HeroUI v3's,
  the selection a list of one id, the first tab that is not disabled selected when none is given, and the arrow
  keys following the reading direction — verified by: unit
- **FR-136**: On native, `Tabs` SHALL be HeroUI Native's, keeping its own selected id and reading as horizontal —
  verified by: unit
- **FR-137**: `@stackra/ui/contracts` SHALL hold `AccordionContractProps`, `AccordionItem` and `AccordionVariant`; on
  web, `Accordion` SHALL be HeroUI v3's with `expandedKeys` as ids and `canExpandMultiple` — verified by: unit
- **FR-138**: On native, `Accordion` SHALL be HeroUI Native's with `canExpandMultiple` choosing a string or a list —
  verified by: unit
- **FR-139**: The `/tabs` playground route SHALL show both variants, both orientations and a disabled tab, and axe
  SHALL report nothing — verified by: unit, e2e
- **FR-140**: The `/accordion` playground route SHALL show single and multiple expansion, both variants and a disabled
  item, and axe SHALL report nothing — verified by: unit, e2e
- **FR-141**: `@stackra/ui/contracts` SHALL hold `CursorPaginationContractProps` (`hasMore`, `hasPrevious`, `onNext`,
  `onPrevious`, `mode`, `count`, `isLoading`) and `BreadcrumbsContractProps` with `BreadcrumbItem` — verified by:
  unit, typecheck
- **FR-142**: On web, `CursorPagination` SHALL be a named navigation with previous and next buttons in `pager` mode, a
  load-more button in `load-more` mode, a refused press while loading and chevrons that mirror in right-to-left —
  verified by: unit
- **FR-143**: On native, `CursorPagination` SHALL offer the same modes and refusals as on web — verified by: unit
- **FR-144**: On web, `Breadcrumbs` SHALL be HeroUI v3's, wrap onto further lines, and mark the last step as the
  current page — verified by: unit
- **FR-145**: On native, `Breadcrumbs` SHALL be a text trail of pressable steps with the current page as plain text and
  a mirrored chevron between steps — verified by: unit
- **FR-146**: The `/cursor-pagination` and `/breadcrumbs` playground routes SHALL show every mode and a long trail in
  both directions, and axe SHALL report nothing — verified by: unit, e2e
- **FR-147**: `@stackra/ui/contracts` SHALL hold `StateContractProps`, `EmptyStateContractProps`,
  `ErrorStateContractProps`, `PageSkeletonContractProps` and the `EmptyReason`, `ErrorKind` and `PageSkeletonLayout`
  enums, with a required `title` on both states and a required `loadingLabel` on the page skeleton — verified by:
  unit, typecheck
- **FR-148**: `STATE_ICON`, `PAGE_SKELETON_ROWS` and `errorDetailsOf` SHALL pick the icon of a reason or kind, the
  bones of a layout, and the message an error shows as its details — verified by: unit
- **FR-149**: On web, `EmptyState`, `ErrorState` and `PageSkeleton` SHALL be the adapted forms on free parts (HeroUI has
  none): `ErrorState` a live `alert` with an optional retry, `EmptyState` not live, `PageSkeleton` one named
  busy region — verified by: unit
- **FR-150**: On native, `EmptyState`, `ErrorState` and `PageSkeleton` SHALL be the same adapted forms, every string
  child wrapped in `Text` — verified by: unit
- **FR-151**: The `/empty-state`, `/error-state` and `/page-skeleton` playground routes SHALL show every reason, kind
  and layout, and axe SHALL report nothing — verified by: unit, e2e
- **FR-152**: `@stackra/ui/contracts` SHALL hold the props every wave 6 shell piece shares: `NavigationItem` (a
  `CollectionItem` with a required `label`, and `href`, `icon`, `isCurrent`, `badge`, `children`, `isDisabled`,
  `shortcut` and `onPress`), `LandmarkContractProps` (`label`), `ShellSlotsContractProps` (`startContent`,
  `endContent`), `TitledContractProps` (a required `title`, `description`, `headingLevel`),
  `LayoutBreakpointContractProps` (`collapseBelow`) and the `LayoutBreakpoint` enum (`sm`, `md`, `lg`, `xl`) — verified
  by: unit, typecheck
- **FR-153**: `@stackra/navigation` (`packages/experience/navigation`) SHALL be a `tier:lib` member that depends on
  `@stackra/ui` and takes React Router 7 and React Navigation 7 as optional peers, so router UI lives there and
  `@stackra/ui` imports no router — verified by: validate, boundaries
- **FR-154**: `@stackra/ui/contracts` SHALL hold the wave 6 component props and the `ScreenEdge` enum:
  `AppShellContractProps` with `AppShellSidebarState`, `SidebarContractProps`, `NavigationListContractProps`,
  `AppHeaderContractProps`, `PageHeaderContractProps`, `SectionContractProps`, `SingleColumnLayoutContractProps`,
  `TwoColumnLayoutContractProps`, `ScreenContractProps`, `NavigationHeaderContractProps` and `TabBarContractProps`,
  each built from the shared shell contracts of FR-152 — verified by: typecheck
- **FR-155**: `currentStateOf` SHALL say whether a navigation item is the current page, holds the current page in its
  children (an ancestor) or neither, and `markCurrentItems` SHALL flag the entry whose `href` is the longest
  whole-segment prefix of a pathname — verified by: unit
- **FR-156**: On web, `NavigationList` SHALL be a named `nav` of nested lists whose links are React Aria links drawn as
  HeroUI ghost buttons, marking the current place with `aria-current` (`page`, or `true` on an entry that only holds
  it) and not by colour alone, drawing a badge only for a non-empty value and showing a `shortcut` in a tooltip —
  verified by: unit, e2e
- **FR-157**: On native, `NavigationList` SHALL be the adapted form: pressable rows in HeroUI Native's `ListGroup` that
  run `onPress` and then follow `href` through the nearest `RouterProvider`, with the current row selected and every
  string child wrapped in `Text` — verified by: unit
- **FR-158**: On web, `Sidebar` SHALL stack `startContent`, the `NavigationList` and `endContent`, and collapse to an
  icon rail and back through a toggle whose state is controlled by `isCollapsed` and `onCollapsedChange` or left to
  `defaultCollapsed` — verified by: unit, e2e
- **FR-159**: On native, `Sidebar` SHALL be the adapted form, an inset column of `startContent`, the `NavigationList`
  and `endContent` — verified by: unit
- **FR-160**: On web, `AppShell` SHALL put a skip link first in the tab order, the sidebar column at the inline start,
  the header above the page and the page in one focusable `main`, and from `collapseBelow` down draw the sidebar in a
  `Drawer` that the app opens by state and that closes when a navigation entry is chosen — verified by: unit, e2e
- **FR-161**: On native, `AppShell` SHALL be the adapted form: the header, the page filling the screen and the sidebar
  in a bottom sheet opened by `isOpen`, `defaultOpen` and `onOpenChange` — verified by: unit
- **FR-162**: The `/app-shell`, `/sidebar` and `/navigation-list` playground routes SHALL show the shell, the expanded
  and collapsed sidebar and every navigation state, and axe SHALL report nothing — verified by: unit, e2e
- **FR-163**: `splitPageActions` and `pageActionVariant` SHALL give a page's ordered actions the first as primary, the
  next two as secondary and the rest to an ActionMenu, so `PageHeader` and `Section` share one rule — verified by:
  unit
- **FR-164**: On web, `AppHeader` SHALL be a `header` holding `startContent`, `title`, the `search` slot taking the room
  left over, `endContent` and `userMenu` from the inline start, naming itself with `label` only when one is given —
  verified by: unit
- **FR-165**: On web, `PageHeader` SHALL be a `header` holding the breadcrumb trail, the title as a real heading, a
  `status`, a muted description and the ordered `actions`, where an action with an `href` navigates through the nearest
  `RouterProvider` — verified by: unit
- **FR-166**: On native, `AppHeader` SHALL be the same bar as a row that mirrors in right-to-left, named by `label` —
  verified by: unit
- **FR-167**: On native, `PageHeader` SHALL be the same page top as a column, an action with an `href` following it after
  its `onPress` and every string child wrapped in `Text` — verified by: unit
- **FR-168**: The `/app-header` and `/page-header` playground routes SHALL show every part, the action overflow and a
  narrow width without horizontal scrolling, and axe SHALL report nothing — verified by: unit, e2e
- **FR-169**: On web, `Section` SHALL be HeroUI's `Card` as a `section` landmark named by its title, which is a real
  heading at `headingLevel`, with a muted description and the ordered `actions` — verified by: unit
- **FR-170**: On native, `Section` SHALL be the adapted form: a group named by its title or `label`, with the same
  heading, description and ordered actions, and every string child wrapped in `Text` — verified by: unit
- **FR-171**: `SingleColumnLayout` SHALL stack its children with an even gap, on web and on native, and draw no landmark
  — verified by: unit
- **FR-172**: `TwoColumnLayout` SHALL place its `aside` at the logical end from `collapseBelow` up and stack it under the
  main column below it on web, and stack the two columns in one view on native, which ignores `collapseBelow` —
  verified by: unit
- **FR-173**: The `/section`, `/single-column-layout` and `/two-column-layout` playground routes SHALL show the layouts
  at each breakpoint, and axe SHALL report nothing — verified by: unit, e2e
- **FR-174**: `Screen` SHALL be the page container of a screen outside the shell, keeping clear of the safe areas on its
  `edges` and scrolling its content when `isScrollable`, as a `main` landmark on web and a safe-area view on native —
  verified by: unit
- **FR-175**: `NavigationHeader` SHALL hold a back control that is a link for `backHref` and a button for `onBack`, the
  title as a heading and `startContent` and `endContent`, with a large title under the bar when `hasLargeTitle`, and
  mirror the row and its chevron in right-to-left, on web and on native — verified by: unit
- **FR-176**: On native, `TabBar` SHALL draw up to five tabs from navigation items, each an icon, a label and a count
  badge, announce the current tab as selected, refuse a press on a disabled tab and follow `href` through the nearest
  `RouterProvider`; it has no web form because the web shell uses the Sidebar — verified by: unit
- **FR-177**: The `/screen` and `/navigation-header` playground routes SHALL show the screen container and every header
  form, and axe SHALL report nothing — verified by: unit, e2e
- **FR-178**: `@stackra/navigation/contracts` SHALL hold `OverlayPresentation` (`modal`, `sheet`, `drawer`,
  `full-screen`), `RouteOverlayContractProps` with a required `title` and `closeLabel`, `RouteOverlayControls`,
  `RouteOverlayState` and `RouteLeaveConfirmationContractProps` — verified by: unit, typecheck
- **FR-179**: On web, `RouteOverlay` SHALL show a route as a modal, sheet, drawer or full-screen dialog whose route is
  its open state, close by returning to where the user came from, and offer `useRouteOverlay` with `close`, `complete`
  and `setDismissable` — verified by: unit
- **FR-180**: On web, `ReactRouterProvider` SHALL fill the `RouterProvider` seam with React Router's `useNavigate` and
  `useHref`, so a link in the kit navigates through the app's router without the kit importing one — verified by: unit
- **FR-181**: On web, `RouteLeaveConfirmation` SHALL block a route change while the page holds unsaved work and ask
  through LeaveConfirmation whether to stay or leave — verified by: unit
- **FR-182**: On native, `RouteOverlay` SHALL be a React Navigation screen that presents as a sheet, drawer, modal or
  full screen through `routeOverlayScreenOptions`, with the same controls as on web — verified by: unit
- **FR-183**: On native, `ReactNavigationProvider` SHALL fill the seam with React Navigation's `useLinkTo`, and
  `RouteLeaveConfirmation` SHALL ask before a screen with unsaved work is left — verified by: unit
- **FR-184**: The `/route-overlay` playground route SHALL show each presentation opened by a route, a dismissal that is
  refused while work is unsaved and a close that returns focus, and axe SHALL report nothing — verified by: unit, e2e
- **FR-185**: `@stackra/ui/contracts` SHALL hold the props the resource index pieces share: `ResourceQuery` (`search`,
  `filterValues`, `sort`) with `ResourceQueryContractProps` (a required `query` and `onQueryChange`, controlled only),
  `ResourceAction` (a `MenuLeafItem` whose `onPress` may return a promise), `AllMatchingSelectionContractProps`
  (`totalCount`, `isAllMatchingSelected`, `onAllMatchingSelectedChange`), the `FilterKind` enum (`text`, `number`,
  `select`, `multi-select`, `date-range`, `boolean`), `FilterDefinition` told apart by `kind`, and `FilterValue` with
  `FilterState` — verified by: unit, typecheck
- **FR-186**: `@stackra/ui/contracts` SHALL hold the field props over numbers and days: `NumberFieldContractProps`
  (`FieldContractProps<number | null>` with `placeholder`, `variant`, `isFullWidth`, `minValue`, `maxValue`, `step`,
  `formatOptions`, `hasSteppers`, `incrementLabel`, `decrementLabel`), `DateValueContractProps`
  (`FieldContractProps<CalendarDate | null>` with `variant`, `isFullWidth`, `minValue`, `maxValue`,
  `isDateUnavailable`), `NumberRangeValue` and `DateRangeValue`, and `@internationalized/date` SHALL be a required
  peer of `@stackra/ui` pinned in the `frontend` catalog — verified by: unit, typecheck, validate
- **FR-187**: `@stackra/ui` core SHALL hold `isFilterValueEmpty` (a `boolean` is never empty), `isResourceQueryFiltered`
  (blank search text and empty filters do not count, a sort never does) and `clearResourceQueryFilters` (keeps the
  sort, returns a new query) — verified by: unit
- **FR-188**: `DataTable` in `@stackra/ui/contracts` SHALL extend the `Table` props with `ResourceQueryContractProps`
  (the table reads `query.sort` as its sort and calls `onQueryChange` with the next query), `rowActions`,
  `bulkActions`, `AllMatchingSelectionContractProps` and a `filterBar` node slot; `BulkActionBar` SHALL take
  `selectedCount`, `actions`, `onClearSelection` and `AllMatchingSelectionContractProps` — verified by: unit, typecheck
- **FR-189**: On web, `DataTable` SHALL be the `Table` with a row menu of `rowActions`, the `filterBar` slot above the
  rows, `EmptyState` with the `no-results` reason when the query is filtered and the `no-data` reason otherwise, and a
  `BulkActionBar` while rows are selected — verified by: unit
- **FR-190**: On web, `BulkActionBar` SHALL be a named toolbar that shows the selected count and one button per
  action, shows an action busy while its promise is pending and refuses a second press, leaves the selection alone when
  an action rejects, offers "select all N" only with `totalCount` and a fully selected page, and clears through
  `onClearSelection` — verified by: unit
- **FR-191**: On native, `DataTable` SHALL be the adapted form of `Table` (rows in a list, the `filterBar` slot above,
  a bottom bar for the selection) and `BulkActionBar` a bottom bar whose overflow opens an inset action sheet, with
  every string child wrapped in `Text` — verified by: unit
- **FR-192**: A disabled row or bulk action SHALL refuse its press by pointer, keyboard and touch, and every press
  target in `DataTable` and `BulkActionBar` SHALL be at least 24 CSS pixels — verified by: unit, e2e
- **FR-193**: The `/data-table` and `/bulk-action-bar` playground routes SHALL show search, sort, row actions,
  selection, select all matching, the filtered-empty state and a failing action, and axe SHALL report nothing —
  verified by: unit, e2e
- **FR-194**: `FilterBar` in `@stackra/ui/contracts` SHALL take `ResourceQueryContractProps`, `filters` (a list of
  `FilterDefinition`), a `searchLabel` and an optional `searchPlaceholder` — verified by: unit, typecheck
- **FR-195**: On web, `FilterBar` SHALL draw a search field bound to `query.search`, an add-filter menu listing the
  filters not yet applied, one removable chip per applied filter and a clear-all button shown only while
  `isResourceQueryFiltered` is true; choosing a filter opens the editor of its kind in a popover — verified by: unit
- **FR-196**: Each filter kind SHALL have one editor that returns a `FilterValue` of its kind: a text field, two
  `NumberField`s, a single-choice list, a multi-choice list, two `DateField`s and a yes-or-no choice, and a value that
  `isFilterValueEmpty` drops its chip and its key — verified by: unit
- **FR-197**: On native, `FilterBar` SHALL be the adapted form that opens its editors in an inset sheet from the same
  `filters`, and the `/filter-bar` playground route SHALL show every kind, with axe reporting nothing —
  verified by: unit, e2e
- **FR-198**: `EntityPicker` in `@stackra/ui/contracts` SHALL be a field over a list of chosen `EntityOption`s (`id`,
  `label`, `description`, `avatar`) with an async `loadOptions(search)` and a single or multiple `selectionMode` —
  verified by: unit, typecheck
- **FR-199**: On web, `EntityPicker` SHALL be `ComboBox` with `TagGroup` for the chosen entities, asking `loadOptions`
  after the user pauses typing, ignoring a response that a later request has replaced, and showing a loading, an
  empty and an error state in the list — verified by: unit
- **FR-200**: On native, `EntityPicker` SHALL be the adapted form: a field that opens an inset sheet with a search
  field and a list, every string child wrapped in `Text` — verified by: unit
- **FR-201**: The `/entity-picker` playground route SHALL show single and multiple selection, a slow load and a
  failing load, and axe SHALL report nothing — verified by: unit, e2e
- **FR-202**: On web, `NumberField` SHALL wrap HeroUI's number field with the label, description and error of the
  field contract, clamp a typed or stepped value to `minValue` and `maxValue`, format with `formatOptions`, hide the
  steppers when `hasSteppers` is false and refuse change from keyboard and pointer when disabled or read-only —
  verified by: unit
- **FR-203**: On native, `NumberField` SHALL be the adapted form on the text input and two buttons with the same
  contract, a number-pad keyboard and every string child wrapped in `Text` — verified by: unit
- **FR-204**: The `/number-field` playground route SHALL show plain, bounded, percent, currency, no-stepper, invalid
  and disabled fields, and axe SHALL report nothing — verified by: unit, e2e
- **FR-205**: On web, `DateField` SHALL wrap HeroUI's date field and `DatePicker` HeroUI's date picker with its
  calendar, both holding `CalendarDate | null`, refusing a day outside `minValue` and `maxValue` or for which
  `isDateUnavailable` is true, and refusing change from keyboard and pointer when disabled or read-only —
  verified by: unit
- **FR-206**: On native, `DateField` SHALL be a field that opens the platform picker and `DatePicker` SHALL be
  `@expo/ui`'s community date-time picker, converting a `CalendarDate` to a `Date` at local noon and back so a day never
  shifts with the time zone — verified by: unit
- **FR-207**: `@expo/ui` SHALL be in the `mobile` catalog at the Expo SDK 57 version and an optional peer of
  `@stackra/ui` used by the native entry only — verified by: validate
- **FR-208**: The `/date-field` and `/date-picker` playground routes SHALL show an empty, a filled, a bounded, an
  invalid and a disabled field, and axe SHALL report nothing in light, dark, LTR and RTL — verified by: unit, e2e

## Success Criteria

- **SC-001**: `pnpm verify` is green with the change — verified by: CI (Quality Gate)
- **SC-002**: The e2e run over every playground route reports no axe violation in the four combinations — verified by: e2e
- **SC-003**: The structure page and the retired package list match the tree — verified by: unit
- **SC-004**: axe reports nothing on `/typography` in light, dark, LTR and RTL, and the computed sizes, line heights
  and letter spacings of every Text type and heading style equal the theme's — verified by: e2e
- **SC-005**: axe reports nothing on `/surface`, `/card`, `/separator`, `/chip`, `/status-badge` and `/badge` in light,
  dark, LTR and RTL, and their computed checks hold (surface colours and card shadow, rule sizes, chip text 4.5:1, icon
  sizes, badge corners by direction, dots 3:1, presses reaching the anchor) — verified by: e2e
- **SC-006**: axe reports nothing on `/avatar`, `/spinner` and `/skeleton` in light, dark, LTR and RTL, every avatar
  initials sample reaches 4.5:1 and every spinner tone 3:1, and under reduced motion no spinner or skeleton animates —
  verified by: e2e
- **SC-007**: axe reports nothing on `/form-field` and `/form-section` in light, dark, LTR and RTL, also with every
  message showing and with a section disabled, a failed submit shows each message linked to its field and in a
  polite status line, the keyboard fills and submits the form, and a disabled section leaves the tab order —
  verified by: e2e
- **SC-008**: axe reports nothing on `/modal` and `/drawer`, closed and with a dialog open, in light, dark, LTR and
  RTL, and focus returns to the trigger on close — verified by: e2e
- **SC-009**: axe reports nothing on `/menu` and `/action-menu`, closed and with a menu open, in light, dark, LTR and
  RTL — verified by: e2e
- **SC-010**: axe reports nothing on `/toast` and `/alert` in light, dark, LTR and RTL, with a toast showing, and a
  toast announces by its tone — verified by: e2e
- **SC-011**: axe reports nothing on `/table`, `/list`, `/property-list`, `/tabs`, `/accordion`, `/cursor-pagination`,
  `/breadcrumbs`, `/empty-state`, `/error-state` and `/page-skeleton` in light, dark, LTR and RTL — verified by: e2e
- **SC-012**: axe reports nothing on `/app-shell`, `/sidebar`, `/navigation-list`, `/app-header`, `/page-header`,
  `/section`, `/single-column-layout`, `/two-column-layout`, `/screen`, `/navigation-header` and `/route-overlay` in
  light, dark, LTR and RTL, also with the drawer or the overlay open — verified by: e2e
- **SC-013**: axe reports nothing on `/data-table`, `/bulk-action-bar`, `/filter-bar`, `/entity-picker`, `/number-field`,
  `/date-field` and `/date-picker` in light, dark, LTR and RTL, also with a filter popover, a calendar or a list open
  — verified by: e2e

## Out of scope

- Any component beyond the token foundations page and the wave-1 components above (the owner describes them one at a
  time; Button and Link are the rest of wave 1).
- Gen emitting a registry of only the used icon names, and the unknown-name gen error (the registries accept one
  today by hand).
- Custom icons built from SVG files under `assets/icons/` (they join a registry as components until gen converts them).
- A shared component implementation across web and native (ADR 0227 keeps it deferred).
- Converting existing apps to the v3 shape (STA-344).

## Assumptions

- `@heroui/react` 3.2.6 re-exports React Aria's `I18nProvider`, but the owner chose on 2026-10-23 to import it from
  `react-aria-components` directly, pinned to the version HeroUI resolves, so pnpm links one React Aria instance for
  both.

## Status history

- 2026-10-23 · — → Draft · Claude (spec-writer) · from the owner decisions of 2026-10-23 (lite lane, lead's reason)
- 2026-10-23 · Draft → Clarified · Claude (spec-writer) · no open questions: the owner answered all of them
- 2026-10-23 · Clarified → Planned · Claude (spec-writer)
- 2026-10-23 · Planned → Tasked · Claude (spec-writer)
- 2026-10-23 · Tasked → Implementing · Claude (spec-writer) · setup pull request under way
- 2026-10-23 · Implementing · Claude (frontend-builder) · wave 4 foundation: FR-096, FR-097 (ADR 0312)
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 4 components: FR-098 to FR-120, SC-008 to SC-010
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 5 foundation: FR-121, FR-122 (ADR 0313)
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 5 components: FR-123 to FR-151, SC-011
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 6 foundation: FR-152, FR-153 (ADR 0317)
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 6 components: FR-154 to FR-184, SC-012
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 7 foundation: FR-185 to FR-187 (ADR 0318)
- 2026-10-24 · Implementing · Claude (frontend-builder) · wave 7 components: FR-188 to FR-208, SC-013
- 2026-10-24 · Implementing · Claude (ds-web) · wave 7 web components and routes; the native components (FR-191,
  FR-197, FR-200, FR-203, FR-206) move to their own branch as T068
