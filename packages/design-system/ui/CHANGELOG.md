# @stackra/ui

## 0.1.0

### Minor Changes

- dfa0c6a: New package, part of the Stackra Design System (ADR 0302): one component API for the web and native apps, with the
  contracts shared, HeroUI v3 on the web and HeroUI Native with Uniwind on native. This release carries the shared
  contracts (`Size`, `Tone`, `Variant`, `ColorScheme`, `Direction`, the provider props and state), `directionOf`, and a
  `DesignSystemProvider` with `useDesignSystem` on each runtime (`./react`, `./native`): colour scheme, locale and text
  direction. The components follow.
- 9277eeb: Kiosks, lanes and gates (STA-801, ADR 0428 to 0430): `KioskSurface` and `useKiosk` (web and native) with idle reset,
  reach layout, high contrast and audio announcements; `KioskConfig` (`platform.kiosk`) and `enterKioskOnLaunch`;
  `Scale.onWeight` weight streams; the `AccessController` port with its `memory` driver, Ed25519 receipt tokens
  (`signReceiptToken`, `verifyReceiptToken`, `importReceiptPublicKey`) and `ExitGateService`; the `external` customer
  display driver over the native `StackraCustomerDisplay` module; `BASE_DEVICE_CATALOGUE` and `deviceCatalogueOf`.
  `Scale` gains an abstract `onWeight`: a custom `Scale` driver must implement it.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 1271b88: A native app follows the phone's accessibility settings and text size (STA-1535). `@stackra/theming` adds the
  `SystemAccessibility` port (reduce motion, bold text, high contrast, font scale) with `memory`, `browser`
  (`prefers-reduced-motion`, `prefers-contrast`) and `accessibility-info` (React Native `AccessibilityInfo`) drivers,
  `DEFAULT_ACCESSIBILITY_SETTINGS`, the read-only `useAccessibility()` hook, and `ThemingConfig.maxFontScale`, an optional
  cap on the device's text size for dense screens. `@stackra/ui`'s native `DesignSystemProvider` takes `maxFontScale` and
  passes it to HeroUI Native's text and text-input scaling, which stays on.
- 9fa447e: Avatar: image, initials or icon fallback and a square shape on web and native, with `initialsOf`.
- 9fa447e: Add `Badge` with `Badge.Anchor` to `./react` (HeroUI v3) and `./native` (adapted: HeroUI Native has no badge, so it is
  drawn on its `Chip` at the web badge's sizes), with `BadgeVariant`, `BadgePlacement`, `BadgeContractProps` and
  `BadgeAnchorContractProps` in `./contracts`. A badge is a count or dot pinned to a corner of another element: its
  `placement` is named by reading direction (`top-end` is top left in Arabic), it is hidden from assistive technology
  unless it has a `label`, and it never takes a press.
- 897ef24: Add `EnvironmentBanner` (nothing in production, never dismissible), `AiMark` (an AI-capable action, an agent's change
  or AI-generated content, always labelled) and `ModeSwitch` (normal and developer display modes) on web and native,
  with `DisplayMode` and `AiMarkKind` in `./contracts`; register the `sparkles` icon; and export `./testing` with
  `FakeConfirmationProvider`.
- 9fa447e: Add `Button`, `IconButton` and `CloseButton` to `./react` (HeroUI v3) and `./native` (HeroUI Native), with
  `ButtonVariant`, `ButtonContractProps`, `IconButtonContractProps` and `CloseButtonContractProps` in `./contracts`. One
  props API on both runtimes: `variant` (the seven HeroUI variants), `size`, `isDisabled`, `isLoading`, `isFullWidth`,
  `startIcon`, `endIcon`, `label` and `onPress`; every other HeroUI prop, the native press feedback included, passes
  through. `IconButton` and `CloseButton` require a `label`. A loading button refuses presses and keeps focus on web, and
  reports `busy` with a spinner in the label colour on native, where the content also sits in a `LucideProvider`.
- 5ae6115: `useCatalogueText` moved out of the `.` entry into the shared React layer: import it from `@stackra/ui/react` or
  `@stackra/ui/native` (ADR 0004 §1, STA-926). Core no longer imports `@stackra/i18n/react`, and the oxlint disable is
  gone.
- d41fc93: The default words of the web and native components come from the `ui` catalogue through the nearest `I18nProvider`,
  falling back to English without one (STA-788). `useCatalogueText` is exported for packages that ship their own
  catalogue.
- 9fa447e: Add `Chip` and `StatusBadge` to `./react` and `./native`, with `ChipVariant`, `ChipContractProps` and
  `StatusBadgeContractProps` in `./contracts`. A chip is display only: `variant`, `tone`, `size`, `startIcon` and
  `endIcon`, drawn the same on both runtimes with no props (`secondary`, `default`, `md`), and it takes no press handler.
  `StatusBadge` is a neutral chip with a dot in the state's tone before its text, and never a live region.
- d44e69c: `DesignSystemProvider` takes a `material` prop, the glass material's mode (ADR 0320), and sets it on
  `<html data-material>`. It defaults to `solid`, so product UI is opaque; a showcase surface passes `glass`, `frosted`
  or `liquid`. Unmounting puts back what the document had.
- 9fa447e: Add the wave 3 fields to `./react` (HeroUI v3) and `./native` (HeroUI Native): `TextField`, `TextArea`, `InputGroup`,
  `SearchField`, `Select`, `ComboBox`, `TagGroup`, `Checkbox`, `CheckboxGroup`, `RadioGroup`, `Switch`, `Label`,
  `Description`, `FieldError`, `Form`, `FormField` and `FormSection`, with their contract props and `FieldContractProps`,
  `ChoiceOption`, `SelectItem`, `TagItem` and `FormFieldBinding` in `./contracts`. Every field takes one props API on both
  runtimes: `label`, `description`, `errorMessage`, `isRequired`, `isInvalid`, `isDisabled`, `isReadOnly`, `value`,
  `defaultValue`, `onChange(value)` and `name`; the list fields take `items` or `options`. `FormField` binds a field to
  react-hook-form, which is now a required peer dependency of `@stackra/ui` because both `./react` and `./native` export
  `FormField`. The native `DesignSystemProvider` now also sets React Native's `Appearance` and lays its subtree out in a
  `flex: 1` View with the Yoga direction.
- b58ebce: Add the schema form adapters (ADR 0165 decision 2, owner decision 12): the new `./form` entry holds the
  platform-neutral engine (a zod schema's react-hook-form resolver and defaults, the schema form handle and the field
  descriptor), and each renderer declares `useSchemaForm` and `Field` on it. `Form` takes `form` (and on web `submit`)
  to bind `Field.*` by name. Web adds `CheckboxField`, `TextAreaField`, `Turnstile` (Cloudflare's widget,
  script-loaded), `Dropdown`, `Kbd`, `Stat` and the `Component<P>` class-component base; native adds `SchemaForm`,
  `Stat`, `Component`, `tabBarIcon`, and re-exports HeroUI Native's `ListGroup`, `PressableFeedback`, `useThemeColor`
  and `useToast`. `./form` depends on `@stackra/validation` and `zod`.
- 9fa447e: Add `Icon` to `./react` (on `lucide-react`) and `./native` (on `lucide-react-native`), with `IconContractProps`,
  `IconComponent`, `IconComponentProps` and `TextTone` from `./contracts` and `ICON_SIZES` from `.`. It draws any Lucide
  icon, or any component that takes `size`, `color` and `strokeWidth`, at `sm` 16, `md` 20 or `lg` 24 px and in a colour
  role of the theme; it is hidden from assistive technology unless it has a `label`, and `isMirroredInRtl` flips the icons
  that point the reading way. The native `DesignSystemProvider` now mounts a `LucideProvider` (`md`, the theme foreground),
  so `lucide-react-native` is a peer of the whole `./native` entry; `lucide-react` is an optional peer of `./react`.
- 9fa447e: Add `Link` to `./react` (HeroUI v3 `Link`) and `./native` (HeroUI Native `LinkButton`), with `LinkUnderline` and
  `LinkContractProps` in `./contracts`. A link takes `href`, `onPress`, `isDisabled`, `isExternal`, `tone`, `underline`
  (`always` by default, so a link in running text is not told apart by colour alone), `label` and `externalLabel`.
  `Link` imports no router: `./react` re-exports React Aria's `RouterProvider` for client navigation, and `./native` ships
  its own `RouterProvider` (`navigate(href)`) that `@stackra/navigation` binds to React Navigation; without one a native
  app path opens in the system browser.
- 1c29328: The native Button's secondary, tertiary and outline variants, the IconButton in those variants and the CloseButton's
  default draw on Liquid Glass on iOS 26 and later (ADR 0319): a regular, interactive `GlassView` in the colour scheme.
  Everywhere else they keep HeroUI Native's solid look: Android, earlier iOS, a disabled button, and while reduced
  transparency or darker system colours is on (solid until those settings answer, so glass never flashes). Primary,
  ghost and danger stay solid, and a caller's own `background` still wins. `expo-glass-effect` joins the native entry's
  optional peers. There is no blur fallback, so `expo-blur` is not needed; without it, HeroUI Native's optional blur
  overlay for Dialog and BottomSheet falls back to its default overlay.
- 57f55b7: New `Reveal` (ADR 0329): its child fades in and rises into place on the theme's `reveal` step, delayed by `index`
  stagger steps; Motion on the web, a Reanimated entering animation on native. It is still under reduced motion and with
  `isAnimated={false}`. `List` now reveals its rows inside its surface on both platforms; `isAnimated={false}` turns that
  off. The web entry takes `motion` as a peer dependency.
- 2e21e6a: Ship the `ui` catalogue in the seven languages (ar, en, fr, de, es, it, nl) under `assets/lang` (STA-788, ADR 0403).
- 9fa447e: Skeleton and SkeletonGroup on web and native; the web theme stops skeleton motion under reduced motion and sweeps from the inline-start side in right-to-left.
- 9fa447e: Spinner on web and native.
- 9fa447e: Add `Surface`, `Card` and `Separator` to `./react` (HeroUI v3) and `./native` (HeroUI Native), with `SurfaceVariant`,
  `SeparatorVariant`, `Orientation` and the four props contracts in `./contracts`. `variant` is the surface level on
  `Surface` and `Card` and the colour level on `Separator`; `Card` has the parts `Header`, `Title`, `Description`,
  `Content` (HeroUI Native's `Body`) and `Footer`, and `Card.Title` takes a heading `level` (default 3). Every other
  HeroUI prop passes through. On native, `Separator` paints its level with the theme colour and HeroUI Native's own
  `thin` and `thick` variants are not part of the type.
- 9fa447e: `@stackra/ui` adds `Text` and `Heading` to `./react` (HeroUI v3 Typography) and `./native` (HeroUI Native Typography),
  with `TextType`, `HeadingType`, `HeadingLevel`, `TextAlign` and the three props contracts in `./contracts`. `Text` takes
  `type` (`body`, `small`, `caption`), `tone`, `align`, `isTruncated` and `lang`; `Heading` adds a required `level`, which
  is the `h<level>` element on the web, and a `type` that defaults to the level's. Arabic text takes the theme's `-ar`
  styles. Each app adds one `@source` line for `@stackra/ui` so Tailwind and Uniwind see its tone classes.
  
  `@stackra/tokens` adds `h4`, `h5` and `h6` and their Arabic twins to the `stackra` theme (ADR 0303 decision 9), and both
  renderers now draw HeroUI's Typography in the theme's type scale: `renderWebCss` writes an `@layer components` block
  over `.typography--*` (with `:where(:lang(ar))` twins and the weight modifiers), `renderNativeCss` writes
  `.text__root--type-*` in px and a `.type-<token>-ar` class per Arabic twin. `defineTheme` now refuses a type style whose
  `size` is not in px, whose `lineHeight` is not unitless or in px, or whose `letterSpacing` is not zero, `em` or px.
  The committed `web.css` and `native.css` are regenerated.
- e193feb: `@stackra/ui/contracts` stops redefining the shared enums (STA-1383). Breaking:
  
  - `Tone` is removed; use the one `Tone` of `@stackra/contracts` (same five codes). It is an `Enum.of` value, so iterate
    it with `Enum.values(Tone)` instead of `Tone.map`.
  - `ErrorKind` is renamed `ErrorStateKind` (the four kinds an `ErrorState` shows; `@stackra/errors`' `ErrorKind` is the
    ten refusal kinds).
  - `SortDirection` is renamed `AriaSortDirection` (`ascending`, `descending`, the `aria-sort` spelling; contracts'
    `SortDirection` is the `asc`/`desc` wire code).
  
  `@stackra/ui` now depends on `@stackra/contracts`.
- 65da65c: Add the wave 4 overlays, menus, messages and progress indicators to `./react` (HeroUI v3) and `./native` (HeroUI
  Native), with their contract props in `./contracts`: `Modal` and `Drawer` (one root with `Header`, `Title`, `Body`,
  `Footer` and `Close` parts), `AlertDialog`, `ConfirmationProvider` with `useConfirmation`, `LeaveConfirmation`, `Menu`,
  `ActionMenu`, `Popover`, `Tooltip`, `Alert`, `toast` with `ToastProvider`, `ProgressBar` and `ProgressCircle`. Every
  overlay takes `isOpen`, `defaultOpen`, `onOpenChange`, `isDismissable` and `isKeyboardDismissDisabled` where they apply,
  anchored ones take a reading-direction `placement` and `align`, and messages take `tone` and `icon` and announce by
  tone. The kit now registers the `ellipsis` icon and the four tone icons itself. `react-native-reanimated` is a new
  optional peer dependency, needed by the native progress indicators.
- 65da65c: Add the wave 5 data primitives to `./react` (HeroUI v3) and `./native` (HeroUI Native, adapted where it has none), with
  their contract props in `./contracts`: `Table`, `List` with `ListItem`, `PropertyList`, `Tabs`, `Accordion`,
  `CursorPagination`, `Breadcrumbs`, `EmptyState`, `ErrorState` and `PageSkeleton`. Collections take `items` with string
  ids, report a selection as a list of ids, a sort as a column and a direction, and ask for more through `onLoadMore`.
  The state components carry no copy of their own. The kit now registers the `chevron-left` and `chevron-right` icons
  itself, and on native the `check` icon too.
- 69e90f1: Wave 6: the shared shell contracts of `@stackra/ui` (navigation item, landmark, bar slots, title block and layout
  breakpoint) and the new `@stackra/navigation` package that holds the router bindings (ADR 0317).
  
  `@stackra/ui` adds `AppShell`, `Sidebar`, `NavigationList`, `AppHeader`, `PageHeader`, `Section`,
  `SingleColumnLayout`, `TwoColumnLayout`, `Screen` and `NavigationHeader` for web and native, and the native `TabBar`,
  with their contracts.
  
  `@stackra/navigation` adds `./contracts`, `./react` (React Router 7) and `./native` (React Navigation 7): `RouteOverlay`
  with `useRouteOverlay`, the router providers that fill the kit's link seam, and `RouteLeaveConfirmation`.
- 3f2898c: Wave 7 on native (ADR 0318): `NumberField` on a text input and two steppers, reading and writing numbers with
  `@internationalized/number` as the web field does; `DateField` and `DatePicker` on `@expo/ui`'s platform picker
  (Android's dialog, iOS's calendar in a dialog), a day kept at local noon so it never moves with the time zone;
  `EntityPicker` in an inset sheet with a search and a bounded list; and `DataTable`, `BulkActionBar` and `FilterBar`.
  The native `DataTable` takes `scrollEnabled={false}` to lay its rows out inside a page's own `ScrollView`.
  `@internationalized/number` joins the native entry's optional peers.
- 69e90f1: Wave 7 foundation: the shared resource index contracts (query, filters, actions, select all matching), the number and date value props, the query helpers, and `@internationalized/date` and `@expo/ui` as peers.
  
  Wave 7 on the web: `DataTable` with `BulkActionBar`, `FilterBar`, `EntityPicker`, `NumberField`, `DateField` and `DatePicker`, with their contracts (ADR 0318). The native forms follow in a later release.

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
- d8ea8c2: Rule-gap B-6 and B-8 (stackra-233): `eqeqeq` (smart), and on `.tsx` `no-param-reassign` with props,
  `react/display-name`, `react/only-export-components` and `react/jsx-no-literals` at error; the React text and naming
  rules are off in tests, stories and e2e. `jsx-a11y/prefer-tag-over-role` is decided off.
  
  `@stackra/ui`: no behaviour change. Label defaults are new consts instead of reassigned props; the web and native
  `Field` parts and the native glass layer moved to their own files so each hot-reloads; the `Field` table and every
  export keep their names and shapes.
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- f04fec9: Make every declaration emit self-contained (TS2883, STA-1220): explicit types on `TierMultiplierExtension`'s base,
  `Dropdown`, the observability stack functions, `JOB_TYPES` and `SCHEDULED_JOBS`, and the type `PassBase` exported from
  `@stackra/integrations` so a consumer's `extends Pass({ key })` class can be declared.
- 3f2898c: Two fixes for Hermes, the React Native engine:
  
  - **FilterBar no longer crashes on native.** Hermes has no `Intl.ListFormat`, and the FilterBar called it to name
    the one or two chosen options in a chip. Where it is missing, the chip now joins those labels with commas.
  - **`directionOf` reads Arabic and other right-to-left locales correctly on native.** It used `Intl.Locale`, which
    Hermes also lacks. Where it is missing, it reads the locale tag's script, or else its language.
- 69e90f1: Keyboard and accessibility fixes found by the first end-to-end run of waves 6 and 7:
  
  - `Table` walks its cells with the arrow keys and lands on a cell's link or button, so a `DataTable` row menu is reachable from the keyboard. HeroUI's "tab" navigation left it out of reach.
  - `RadioGroup` reads an empty `value` or `defaultValue` as "nothing chosen", so the group keeps a Tab stop.
  - `DatePicker` shows narrow weekday names, so the Arabic calendar fits its grid.
  - `NavigationList` draws the current entry's bar as an element, so its text's contrast can be measured.
  - `EntityPicker` draws one remove button per tag.
  - `RouteOverlay` gives focus back to its opener after Escape closes it.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
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
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [9fa447e]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [57f55b7]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e99b97a]
- Updated dependencies [d44e69c]
- Updated dependencies [5c23791]
- Updated dependencies [12fe727]
- Updated dependencies [d82cd1a]
- Updated dependencies [3a7615d]
- Updated dependencies [3f61d95]
- Updated dependencies [9fa447e]
- Updated dependencies [9fa447e]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/tokens@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
