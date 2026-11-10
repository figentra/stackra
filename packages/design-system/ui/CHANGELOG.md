# @stackra/ui

## 0.33.0

### Minor Changes

- 22493bf: `PdfPreview` (`@stackra/ui/react`) shows a PDF in the browser's own viewer: a sandboxed frame that sends no referrer, with a download button as the fallback where the browser shows no PDF in a page (many mobile WebViews). No PDF library is added. A cross-origin link (the signed object-storage URL it is meant for) may run the viewer's scripts in its own origin; a same-origin link gets no scripts, so the frame can never lift its sandbox.

### Patch Changes

- 41a5ff0: `Alert` gets the first package e2e proof: a page and a Playwright spec that check, in a real browser, that each tone announces itself, that there are no console errors, and that the `ar` project lays the document out right to left. Adds the `test:e2e` script.
- Updated dependencies [4937622]
- Updated dependencies [82c2718]
- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/i18n@0.33.0
  - @stackra/config@0.33.0
  - @stackra/contracts@0.33.0
  - @stackra/icons@0.33.0
  - @stackra/tokens@0.33.0
  - @stackra/shortcuts@0.33.0
  - @stackra/container@0.33.0
  - @stackra/validation@0.33.0

## 0.32.0

### Patch Changes

- 54db249: `CalendarSystem` (`@stackra/ui/contracts`) is now the list of `@stackra/i18n`'s `CalendarSystem`, the one source the date
  formatting and a tenant's `DisplaySettings.calendar` read. Same values and the same frozen list, so nothing that uses it
  changes.
- Updated dependencies [9ddce28]
  - @stackra/config@0.32.0
  - @stackra/icons@0.32.0
  - @stackra/tokens@0.32.0
  - @stackra/i18n@0.32.0
  - @stackra/shortcuts@0.32.0
  - @stackra/container@0.32.0
  - @stackra/contracts@0.32.0
  - @stackra/validation@0.32.0

## 0.31.0

### Minor Changes

- 7179d1a: `ChatFormPart` (`@stackra/panel/react`) draws an action's form in a chat turn from its JSON Schema input: one field per key, drawn as a screen draws it, prefilled by the assistant, with uploads through the host's `upload`, and sent as the person's answer. `useZodFormHandle` (`@stackra/ui/form`) runs a form over a zod schema with no class, and `useSchemaFormHandle` now builds on it. `TamoFormPart` gains `id`, which the host answers with the sent values, as a question's.

### Patch Changes

- Updated dependencies [0f05f60]
  - @stackra/i18n@0.31.0
  - @stackra/icons@0.31.0
  - @stackra/tokens@0.31.0
  - @stackra/shortcuts@0.31.0
  - @stackra/config@0.31.0
  - @stackra/container@0.31.0
  - @stackra/contracts@0.31.0
  - @stackra/validation@0.31.0

## 0.30.0

### Minor Changes

- 85cd1b5: `@stackra/ui` adds `ApprovalCard`, a tool call that waits for a person: what will run, its input and risk, and Approve
  and Deny until it is answered or expires. `@stackra/ai`'s `ChatSurface` now also draws a turn's AI SDK UI message parts
  in order (text, reasoning, sources, a tool approval as an `ApprovalCard`, and each `data-tamo-<kind>` part through the
  host's `renderers`), and `./contracts` adds the typed data of Tamo's chat parts (`TamoPartKind`, `TamoPartData`).
- d3c8b27: Blueprint primitives for marketing pages on the web (STA-2041), drawn from the `--blueprint-*` roles:
  `BlueprintSection` (a ruled band with `+` marks at its top corners), `Frame variant="schematic"` (a striped title bar
  on the blueprint frame radius), `Schematic` and `SchematicNode` (named parts joined by measured orthogonal pipes with
  junction squares, drawn in on 80 ms floor steps at the full motion level, mirrored in right-to-left by measuring) and
  `SectionDock` (a sticky bar of section links with scroll-spy and a status line that is not a live region; under `md`
  the other links stay reachable and show while focused). `Illustration` draws a landing drawing in four token-coloured
  mask layers (`<src>.<tone>.svg` for ground, dots, line and core) and never mirrors. `useFloorSteps` is the one
  whole-step reveal behind `Schematic`, `TerminalDemo` and other floor-step motion. `DitherArt` gains `mode="glyphs"`
  (code characters in the mono font), `glyphs` and `sun` (moves the core glow, measured from the inline start); in
  right-to-left a dot field now mirrors as a whole, while glyphs never mirror. In left-to-right its defaults draw exactly
  as before.
  
  `ButtonLink`: a link drawn as a Stackra button (the `core` variant and `pill` shape included), for a call to action
  that navigates without script.
- d3c8b27: Landing components for marketing pages on the web (STA-2041): `DitherArt` (the six brand patterns as a Bayer 8×8
  dither on a canvas, still under reduced motion, over a required poster), `Frame` (window, phone or plain, on a 10 px
  frame radius), `BentoCard` (with an optional product theme), `PackageList`, `TerminalDemo` (a recorded CLI session
  played a whole line at a time) and `PropsPlayground` (live props with a theme and direction switch scoped to the
  preview). Tabs gain `variant="steps"` and AppHeader `variant="transparent"` (sticky, clear until the page scrolls).

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [8c17109]
- Updated dependencies [f6a087c]
- Updated dependencies [ef49e63]
- Updated dependencies [d3c8b27]
  - @stackra/contracts@0.30.0
  - @stackra/container@0.30.0
  - @stackra/tokens@0.30.0
  - @stackra/shortcuts@0.30.0
  - @stackra/config@0.30.0
  - @stackra/i18n@0.30.0
  - @stackra/validation@0.30.0
  - @stackra/icons@0.30.0

## 0.29.0

### Patch Changes

- Updated dependencies [b4b6422]
  - @stackra/container@0.29.0
  - @stackra/icons@0.29.0
  - @stackra/tokens@0.29.0
  - @stackra/shortcuts@0.29.0
  - @stackra/config@0.29.0
  - @stackra/i18n@0.29.0
  - @stackra/validation@0.29.0
  - @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/icons@0.28.0
  - @stackra/tokens@0.28.0
  - @stackra/shortcuts@0.28.0
  - @stackra/config@0.28.0
  - @stackra/container@0.28.0
  - @stackra/contracts@0.28.0
  - @stackra/i18n@0.28.0
  - @stackra/validation@0.28.0

## 0.27.0

### Patch Changes

- @stackra/icons@0.27.0
  - @stackra/tokens@0.27.0
  - @stackra/shortcuts@0.27.0
  - @stackra/config@0.27.0
  - @stackra/container@0.27.0
  - @stackra/contracts@0.27.0
  - @stackra/i18n@0.27.0
  - @stackra/validation@0.27.0

## 0.26.0

### Patch Changes

- e5da198: The web `Button` takes `href` and `target`: with an `href` (and not disabled or loading) it renders an accessible
  link, React Aria's `Link` with the button's HeroUI classes, the composition `PageActions` already uses, so it
  navigates through the nearest `RouterProvider`. HeroUI v3's button has no `as` and dropped `href`, so
  `<Button as="a" href>` rendered a button that went nowhere. Without `href` it is unchanged.
- @stackra/icons@0.26.0
  - @stackra/tokens@0.26.0
  - @stackra/shortcuts@0.26.0
  - @stackra/config@0.26.0
  - @stackra/container@0.26.0
  - @stackra/contracts@0.26.0
  - @stackra/i18n@0.26.0
  - @stackra/validation@0.26.0

## 0.25.0

### Patch Changes

- @stackra/icons@0.25.0
  - @stackra/tokens@0.25.0
  - @stackra/shortcuts@0.25.0
  - @stackra/config@0.25.0
  - @stackra/container@0.25.0
  - @stackra/contracts@0.25.0
  - @stackra/i18n@0.25.0
  - @stackra/validation@0.25.0

## 0.24.0

### Patch Changes

- @stackra/icons@0.24.0
  - @stackra/tokens@0.24.0
  - @stackra/shortcuts@0.24.0
  - @stackra/config@0.24.0
  - @stackra/container@0.24.0
  - @stackra/contracts@0.24.0
  - @stackra/i18n@0.24.0
  - @stackra/validation@0.24.0

## 0.23.0

### Patch Changes

- 6edeee4: Peers no longer fork a product's install. pnpm gives a package one variant per set of resolved peers, so an optional
  peer one member installs and another does not split every dependent in two: a product with connectors (react-dom for
  their tests) and a pglite service resolved two copies of @stackra/integrations, whose classes then failed each other's
  checks. `@stackra/database`'s test-only packages (PGlite and its extensions, Faker, Testcontainers) are no longer peers:
  its testing entry loads them from the member running the tests, as their devDependencies. `react-dom` is a required peer
  of `@stackra/ui`, `@stackra/app` and `@stackra/notifications`. `stackra validate` refuses a test-only package as a
  library's peer and an optional `react-dom` (`forking-peers`).
- dee48f0: The class-component base `Component<P>` (web and native) declares React's class surface as types only (`state`,
  `context`, `setState`, `forceUpdate`), so tsc takes a subclass as a JSX element and a `ComponentType` with its props
  checked. Nothing is emitted: the compiled component is still a function.
- @stackra/icons@0.23.0
  - @stackra/tokens@0.23.0
  - @stackra/shortcuts@0.23.0
  - @stackra/config@0.23.0
  - @stackra/container@0.23.0
  - @stackra/contracts@0.23.0
  - @stackra/i18n@0.23.0
  - @stackra/validation@0.23.0

## 0.22.0

### Patch Changes

- @stackra/icons@0.22.0
  - @stackra/tokens@0.22.0
  - @stackra/shortcuts@0.22.0
  - @stackra/config@0.22.0
  - @stackra/container@0.22.0
  - @stackra/contracts@0.22.0
  - @stackra/i18n@0.22.0
  - @stackra/validation@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0
  - @stackra/validation@0.21.0
  - @stackra/shortcuts@0.21.0
  - @stackra/config@0.21.0
  - @stackra/container@0.21.0
  - @stackra/i18n@0.21.0
  - @stackra/icons@0.21.0
  - @stackra/tokens@0.21.0

## 0.20.0

### Patch Changes

- Updated dependencies [a7b7e58]
- Updated dependencies [667a3b5]
  - @stackra/container@0.20.0
  - @stackra/validation@0.20.0
  - @stackra/icons@0.20.0
  - @stackra/tokens@0.20.0
  - @stackra/shortcuts@0.20.0
  - @stackra/config@0.20.0
  - @stackra/i18n@0.20.0
  - @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [cb26737]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0
  - @stackra/config@0.19.0
  - @stackra/shortcuts@0.19.0
  - @stackra/container@0.19.0
  - @stackra/i18n@0.19.0
  - @stackra/validation@0.19.0
  - @stackra/icons@0.19.0
  - @stackra/tokens@0.19.0

## 0.18.1

### Patch Changes

- @stackra/icons@0.18.1
  - @stackra/tokens@0.18.1
  - @stackra/shortcuts@0.18.1
  - @stackra/config@0.18.1
  - @stackra/container@0.18.1
  - @stackra/contracts@0.18.1
  - @stackra/i18n@0.18.1
  - @stackra/validation@0.18.1

## 0.18.0

### Patch Changes

- @stackra/icons@0.18.0
  - @stackra/tokens@0.18.0
  - @stackra/shortcuts@0.18.0
  - @stackra/config@0.18.0
  - @stackra/container@0.18.0
  - @stackra/contracts@0.18.0
  - @stackra/i18n@0.18.0
  - @stackra/validation@0.18.0

## 0.17.2

### Patch Changes

- @stackra/icons@0.17.2
  - @stackra/tokens@0.17.2
  - @stackra/shortcuts@0.17.2
  - @stackra/config@0.17.2
  - @stackra/container@0.17.2
  - @stackra/contracts@0.17.2
  - @stackra/i18n@0.17.2
  - @stackra/validation@0.17.2

## 0.17.1

### Patch Changes

- @stackra/icons@0.17.1
  - @stackra/tokens@0.17.1
  - @stackra/shortcuts@0.17.1
  - @stackra/config@0.17.1
  - @stackra/container@0.17.1
  - @stackra/contracts@0.17.1
  - @stackra/i18n@0.17.1
  - @stackra/validation@0.17.1

## 0.17.0

### Patch Changes

- @stackra/icons@0.17.0
  - @stackra/tokens@0.17.0
  - @stackra/shortcuts@0.17.0
  - @stackra/config@0.17.0
  - @stackra/container@0.17.0
  - @stackra/contracts@0.17.0
  - @stackra/i18n@0.17.0
  - @stackra/validation@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [5bf8ad3]
  - @stackra/validation@0.16.0
  - @stackra/icons@0.16.0
  - @stackra/tokens@0.16.0
  - @stackra/config@0.16.0
  - @stackra/i18n@0.16.0
  - @stackra/shortcuts@0.16.0
  - @stackra/container@0.16.0
  - @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/icons@0.15.0
  - @stackra/tokens@0.15.0
  - @stackra/shortcuts@0.15.0
  - @stackra/config@0.15.0
  - @stackra/container@0.15.0
  - @stackra/contracts@0.15.0
  - @stackra/i18n@0.15.0
  - @stackra/validation@0.15.0

## 0.14.4

### Patch Changes

- @stackra/icons@0.14.4
  - @stackra/tokens@0.14.4
  - @stackra/shortcuts@0.14.4
  - @stackra/config@0.14.4
  - @stackra/container@0.14.4
  - @stackra/contracts@0.14.4
  - @stackra/i18n@0.14.4
  - @stackra/validation@0.14.4

## 0.14.3

### Patch Changes

- @stackra/icons@0.14.3
  - @stackra/tokens@0.14.3
  - @stackra/shortcuts@0.14.3
  - @stackra/config@0.14.3
  - @stackra/container@0.14.3
  - @stackra/contracts@0.14.3
  - @stackra/i18n@0.14.3
  - @stackra/validation@0.14.3

## 0.14.2

### Patch Changes

- Updated dependencies [896c8a3]
  - @stackra/container@0.14.2
  - @stackra/icons@0.14.2
  - @stackra/tokens@0.14.2
  - @stackra/shortcuts@0.14.2
  - @stackra/config@0.14.2
  - @stackra/i18n@0.14.2
  - @stackra/validation@0.14.2
  - @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/icons@0.14.1
  - @stackra/tokens@0.14.1
  - @stackra/shortcuts@0.14.1
  - @stackra/config@0.14.1
  - @stackra/container@0.14.1
  - @stackra/contracts@0.14.1
  - @stackra/i18n@0.14.1
  - @stackra/validation@0.14.1

## 0.14.0

### Patch Changes

- @stackra/icons@0.14.0
  - @stackra/tokens@0.14.0
  - @stackra/shortcuts@0.14.0
  - @stackra/config@0.14.0
  - @stackra/container@0.14.0
  - @stackra/contracts@0.14.0
  - @stackra/i18n@0.14.0
  - @stackra/validation@0.14.0

## 0.13.0

### Patch Changes

- @stackra/icons@0.13.0
  - @stackra/tokens@0.13.0
  - @stackra/shortcuts@0.13.0
  - @stackra/config@0.13.0
  - @stackra/container@0.13.0
  - @stackra/contracts@0.13.0
  - @stackra/i18n@0.13.0
  - @stackra/validation@0.13.0

## 0.12.0

### Patch Changes

- @stackra/icons@0.12.0
  - @stackra/tokens@0.12.0
  - @stackra/shortcuts@0.12.0
  - @stackra/config@0.12.0
  - @stackra/container@0.12.0
  - @stackra/contracts@0.12.0
  - @stackra/i18n@0.12.0
  - @stackra/validation@0.12.0

## 0.11.1

### Patch Changes

- @stackra/icons@0.11.1
  - @stackra/tokens@0.11.1
  - @stackra/shortcuts@0.11.1
  - @stackra/config@0.11.1
  - @stackra/container@0.11.1
  - @stackra/contracts@0.11.1
  - @stackra/i18n@0.11.1
  - @stackra/validation@0.11.1

## 0.11.0

### Patch Changes

- @stackra/icons@0.11.0
  - @stackra/tokens@0.11.0
  - @stackra/shortcuts@0.11.0
  - @stackra/config@0.11.0
  - @stackra/container@0.11.0
  - @stackra/contracts@0.11.0
  - @stackra/i18n@0.11.0
  - @stackra/validation@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/config@0.10.0
  - @stackra/contracts@0.10.0
  - @stackra/icons@0.10.0
  - @stackra/tokens@0.10.0
  - @stackra/i18n@0.10.0
  - @stackra/shortcuts@0.10.0
  - @stackra/container@0.10.0
  - @stackra/validation@0.10.0

## 0.9.0

### Minor Changes

- 681d01a: Five web components in `@stackra/ui/react` from the UI build list (STA-1981). `Autocomplete` wraps HeroUI v3's
  Autocomplete with the single ComboBox contract: a select whose list opens with a search box that narrows it.
  `ColorField` wraps HeroUI v3's ColorField with ColorPicker's field contract, a typed `#rrggbb` value with a swatch
  of it. `ColorSwatch` wraps HeroUI v3's ColorSwatch and also draws a colour React Aria cannot parse, such as a token's
  `var()`. `Flag` draws a country's flag from its ISO code (or a language tag's region) with `flagOf`. `MarkerMap`
  places pins by projection on an SVG, with no map tiles, beside a selectable `List` of them in a `SidePanel`.

### Patch Changes

- Updated dependencies [e80a99b]
- Updated dependencies [2e43c48]
- Updated dependencies [e8cb518]
- Updated dependencies [f9c825d]
  - @stackra/validation@0.9.0
  - @stackra/contracts@0.9.0
  - @stackra/tokens@0.9.0
  - @stackra/container@0.9.0
  - @stackra/icons@0.9.0
  - @stackra/config@0.9.0
  - @stackra/i18n@0.9.0
  - @stackra/shortcuts@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [7dd35b3]
  - @stackra/container@0.8.0
  - @stackra/icons@0.8.0
  - @stackra/tokens@0.8.0
  - @stackra/shortcuts@0.8.0
  - @stackra/config@0.8.0
  - @stackra/i18n@0.8.0
  - @stackra/validation@0.8.0
  - @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/icons@0.7.1
  - @stackra/tokens@0.7.1
  - @stackra/shortcuts@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/validation@0.7.1

## 0.7.0

### Patch Changes

- @stackra/icons@0.7.0
  - @stackra/tokens@0.7.0
  - @stackra/shortcuts@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/validation@0.7.0

## 0.6.1

### Patch Changes

- @stackra/icons@0.6.1
  - @stackra/tokens@0.6.1
  - @stackra/shortcuts@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/validation@0.6.1

## 0.6.0

### Minor Changes

- d53d9d3: Button gains `variant="core"` and `shape="pill"`, and Heading and Text gain `tone="core"`, for the Stackra champagne
  core (STA-2016). `core` draws HeroUI's primary filled by the theme's `core-strong` (web `button--core`, native
  `bg-core-strong`). A pill takes the theme's `--radius-pill`. Heading draws `core` at the looks h1 to h4 and
  `core-strong` below; Text always draws `core-strong`. Until `@stackra/tokens` ships the core roles (STA-2015), a core
  button draws as the primary and core text keeps its default colour.
- 712fb89: Spinner, ProgressBar, ProgressCircle and RouteProgress draw the brand's dot loader on web and native (STA-2017,
  figentra/brand rules §41), under the loaders' exception to ADR 0303 decision 6 (owner, 2026-11-02). Dots build the st
  tile's floors 80 ms a step with the last or leading dot in the emphasis colour (`--core`, falling back to the accent
  on the web; the tone's colour on native until STA-2015). Every prop, role, name and value stays. Reduced motion,
  from the system or the provider, shows the dots at rest. The web Spinner's props are now the span's own (HeroUI's
  `animation` and `render` are gone) and the native Spinner's the view's.

### Patch Changes

- Updated dependencies [ef62362]
  - @stackra/tokens@0.6.0
  - @stackra/icons@0.6.0
  - @stackra/shortcuts@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/validation@0.6.0

## 0.5.1

### Patch Changes

- @stackra/icons@0.5.1
  - @stackra/tokens@0.5.1
  - @stackra/shortcuts@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/validation@0.5.1

## 0.5.0

### Patch Changes

- d7f72d3: The `@heroui/react` peer range is `^3.2.7`, the first release with `Sheet`, which `@stackra/ui/react` imports; a consumer on
  3.2.6 failed to build with MISSING_EXPORT.
- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/icons@0.5.0
  - @stackra/tokens@0.5.0
  - @stackra/shortcuts@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/validation@0.5.0

## 0.4.0

### Minor Changes

- 149ca06: Add the `@stackra/ui/rich-text` subpath (STA-1895). The web `RichTextEditor` and its `RichTextEditorProps`,
  `RichTextContribution` and `RichTextToolbarItem` types move there from `@stackra/ui/react`, so no other entry imports
  `@tiptap/*`. Vite stubs a missing optional peer, so 0.3.0 failed a consumer build that had no TipTap installed with
  `MISSING_EXPORT` for `CharacterCount`, `Placeholder` and `EditorContent`. The `@tiptap/*` peers stay optional.
  
  ### Breaking
  
  - `RichTextEditor` and its three types are no longer exported from `@stackra/ui/react`. Change
    `import { RichTextEditor } from "@stackra/ui/react"` to `import { RichTextEditor } from "@stackra/ui/rich-text"`.
    Only an app that renders the editor needs the `@tiptap/*` peers.

### Patch Changes

- 1567384: `@stackra/ui/native` loads in an app without `@shopify/react-native-skia`, which stays an optional peer (Expo SDK 57's
  2.6.2). The Skia-backed charts, maps and the chart export reach Skia and `victory-native` through lazy `require`s the build
  keeps for Metro, and draw nothing when the app has not installed them (STA-1791).
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
  - @stackra/validation@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/icons@0.4.0
  - @stackra/tokens@0.4.0
  - @stackra/config@0.4.0
  - @stackra/i18n@0.4.0
  - @stackra/shortcuts@0.4.0

## 0.3.0

### Minor Changes

- 9ed272a: One data family (ADR 0505, breaking): nine public data components on the `useCollection` engine, `Table`,
  `DataTable`, `DataGrid`, `List`, `DataView`, `ColumnEditor`, `FilterBar`, `FilterPanel` and `SavedViews`
  (`variant` `menu`, `tabs` or `chips`). `CollectionColumn` is the one column type (`type` text, number, choice,
  date or boolean, with `isEditable`, `isReadOnly`, `isRequired`, `min`, `max` and `validate`); `CollectionFilter`
  is the one filter model (new operators `in`, `not_in`, `between`, `before`, `after`, `is_true`, `is_false`).
  `DataTable` and `DataGrid` take `collection` or the shorthand `items` and `columns`; DataGrid's `rows`, `height` and
  `frozenColumns` became `items`, `maxHeight` and a column's `pin`; Table's `sortDescriptor` became `sort[]`.
  Removed: `ColumnChooser`, `SavedViewsMenu`, `ResourceQuery`, `ResourceQueryContractProps`, `FilterState`, the ui
  `SavedView`, `DataGridColumn`, `DataGridCellType`, `DataGridOption`, `SortOption`, `FacetOption`, and the
  `query`, `onQueryChange`, `filters`, `hiddenColumns`, `groupBy`, `aggregates`, `editableColumns`, `gridColumns`,
  `onNext` and `onPrevious` props. No longer exported: `ColumnEditorPanel`, `ColumnMenu`, `CollectionFilterEditor`,
  `CollectionSortEditor`, `DataViewCards`, `DataViewBoard` and `CollectionRowPanel`.
  
  A column's `filter` sets its quick filter's editor: `placeholder` (text), `step` and `formatOptions` (number, a
  currency say), `trueLabel` and `falseLabel` (yes or no) and `isDisabled` (listed but refused). The native
  `DataTable` honours `hasColumnTools` with a `ColumnEditor` beside the filter bar.
  
  `FilterBar` takes `unappliedIds`: the conditions and groups the data source does not apply are drawn as warning
  chips, led by a warning button whose name and tooltip are the `ui` catalogue's "Not applied on the server".

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- 895a526: <!-- Purpose: release note for `optionalRequires`. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0025; STA-1722. -->
  
  `library({ optionalRequires })` rewrites a native entry's shimmed `__require("expo-…")` of a listed optional peer back
  to a literal `require` call, so Metro sees and bundles the peer; 0.2.0's `native.mjs` called it through the
  `__require` shim, which Metro never resolves, so haptics, clipboard, pickers, video and Apple sign-in stayed off. Any
  other `require` in a chunk fails the build.
- 6484453: <!-- Purpose: release note for the ui require-shim fix: react-dom stays external and no dist may carry rolldown's __require shim. Boundary: changelog text only. Runtime: none. Governing contract: ADR 0025; STA-1722. -->
  
  `@stackra/ui` declares `react-dom` as an optional peer, so it is no longer bundled: 0.2.0 inlined CommonJS react-dom,
  whose `require("react")` became rolldown's `__require` shim and threw for every ESM consumer. `library()` in
  `@stackra/tsdown-config` now fails a build whose output calls `__require(...)`, naming the chunk and the module.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/icons@0.3.0
  - @stackra/tokens@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- c4f295e: The `./native` entry exports `useGlassMaterial()` and its `GlassMaterial` type, so an app's own glass (the mobile showcase's hero tiles) makes the same Liquid Glass or solid decision as the quiet buttons.
- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/tokens@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0

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
