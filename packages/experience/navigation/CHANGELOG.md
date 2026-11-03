# @stackra/navigation

## 0.7.1

### Patch Changes

- @stackra/iam@0.7.1
  - @stackra/clients@0.7.1
  - @stackra/seo@0.7.1
  - @stackra/icons@0.7.1
  - @stackra/ui@0.7.1
  - @stackra/testing@0.7.1
  - @stackra/platform@0.7.1
  - @stackra/config@0.7.1
  - @stackra/container@0.7.1
  - @stackra/contracts@0.7.1
  - @stackra/errors@0.7.1
  - @stackra/i18n@0.7.1
  - @stackra/validation@0.7.1
  - @stackra/feature-flags@0.7.1
  - @stackra/settings@0.7.1

## 0.7.0

### Patch Changes

- Updated dependencies [1f5bf76]
- Updated dependencies [1f5bf76]
  - @stackra/iam@0.7.0
  - @stackra/settings@0.7.0
  - @stackra/clients@0.7.0
  - @stackra/seo@0.7.0
  - @stackra/icons@0.7.0
  - @stackra/ui@0.7.0
  - @stackra/testing@0.7.0
  - @stackra/platform@0.7.0
  - @stackra/config@0.7.0
  - @stackra/container@0.7.0
  - @stackra/contracts@0.7.0
  - @stackra/errors@0.7.0
  - @stackra/i18n@0.7.0
  - @stackra/validation@0.7.0
  - @stackra/feature-flags@0.7.0

## 0.6.1

### Patch Changes

- @stackra/clients@0.6.1
  - @stackra/seo@0.6.1
  - @stackra/icons@0.6.1
  - @stackra/ui@0.6.1
  - @stackra/testing@0.6.1
  - @stackra/platform@0.6.1
  - @stackra/config@0.6.1
  - @stackra/container@0.6.1
  - @stackra/contracts@0.6.1
  - @stackra/errors@0.6.1
  - @stackra/i18n@0.6.1
  - @stackra/validation@0.6.1
  - @stackra/iam@0.6.1
  - @stackra/feature-flags@0.6.1
  - @stackra/settings@0.6.1

## 0.6.0

### Minor Changes

- 99750d4: A package records the `Route` and `Menu` classes of its `react` and `native` entries in its manifest (`ui.routes`, with
  the page beside each route, and `ui.menus`), and an app's route tables list them on the runtime their entry serves,
  imported from `<package>/<entry>`, so no app hand-writes a `register()`. Every menu, the app's own and its packages',
  is registered under its key through the new `registerMenus` of `@stackra/navigation`, and `useMenus(kind?)` lists them
  for a shell. One route or menu key from two owners is refused (`route_duplicate`, `menu_duplicate`) (STA-1947).

### Patch Changes

- Updated dependencies [e250d4f]
- Updated dependencies [d53d9d3]
- Updated dependencies [712fb89]
  - @stackra/iam@0.6.0
  - @stackra/ui@0.6.0
  - @stackra/settings@0.6.0
  - @stackra/clients@0.6.0
  - @stackra/seo@0.6.0
  - @stackra/icons@0.6.0
  - @stackra/testing@0.6.0
  - @stackra/platform@0.6.0
  - @stackra/config@0.6.0
  - @stackra/container@0.6.0
  - @stackra/contracts@0.6.0
  - @stackra/errors@0.6.0
  - @stackra/i18n@0.6.0
  - @stackra/validation@0.6.0
  - @stackra/feature-flags@0.6.0

## 0.5.1

### Patch Changes

- @stackra/iam@0.5.1
  - @stackra/settings@0.5.1
  - @stackra/clients@0.5.1
  - @stackra/seo@0.5.1
  - @stackra/icons@0.5.1
  - @stackra/ui@0.5.1
  - @stackra/testing@0.5.1
  - @stackra/platform@0.5.1
  - @stackra/config@0.5.1
  - @stackra/container@0.5.1
  - @stackra/contracts@0.5.1
  - @stackra/errors@0.5.1
  - @stackra/i18n@0.5.1
  - @stackra/validation@0.5.1
  - @stackra/feature-flags@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [d7f72d3]
- Updated dependencies [d7f72d3]
  - @stackra/i18n@0.5.0
  - @stackra/ui@0.5.0
  - @stackra/clients@0.5.0
  - @stackra/seo@0.5.0
  - @stackra/settings@0.5.0
  - @stackra/iam@0.5.0
  - @stackra/icons@0.5.0
  - @stackra/testing@0.5.0
  - @stackra/platform@0.5.0
  - @stackra/config@0.5.0
  - @stackra/container@0.5.0
  - @stackra/contracts@0.5.0
  - @stackra/errors@0.5.0
  - @stackra/validation@0.5.0
  - @stackra/feature-flags@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [0b660e0]
- Updated dependencies [3ce01cf]
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
- Updated dependencies [bb08f25]
- Updated dependencies [1856ee0]
- Updated dependencies [70e6c17]
- Updated dependencies [36dbd49]
- Updated dependencies [9574c22]
- Updated dependencies [f490040]
- Updated dependencies [2f5ab1e]
- Updated dependencies [dbb60dc]
- Updated dependencies [149ca06]
- Updated dependencies [1567384]
  - @stackra/validation@0.4.0
  - @stackra/settings@0.4.0
  - @stackra/contracts@0.4.0
  - @stackra/container@0.4.0
  - @stackra/iam@0.4.0
  - @stackra/ui@0.4.0
  - @stackra/clients@0.4.0
  - @stackra/seo@0.4.0
  - @stackra/icons@0.4.0
  - @stackra/platform@0.4.0
  - @stackra/config@0.4.0
  - @stackra/errors@0.4.0
  - @stackra/i18n@0.4.0
  - @stackra/feature-flags@0.4.0
  - @stackra/testing@0.4.0

## 0.3.0

### Minor Changes

- ccc0b0f: Add `ai?: false` and `context?` to `RouteOptions` (STA-1631, ADR 0490): `ai: false` keeps a route out of the agent's
  client tools, and `context` names the page context a route publishes with each AI turn (the record its `:param` holds,
  and whether it publishes a selection, filters, a view and a modal).

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- d5b5411: The `react-router` peer is `^7.18.4` instead of the exact `7.18.4`, so a consumer can take react-router's later 7.x
  security fixes without an override (STA-1736).
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
- Updated dependencies [23e556c]
- Updated dependencies [895a526]
- Updated dependencies [9ed272a]
- Updated dependencies [6484453]
  - @stackra/clients@0.3.0
  - @stackra/config@0.3.0
  - @stackra/container@0.3.0
  - @stackra/contracts@0.3.0
  - @stackra/errors@0.3.0
  - @stackra/feature-flags@0.3.0
  - @stackra/i18n@0.3.0
  - @stackra/iam@0.3.0
  - @stackra/icons@0.3.0
  - @stackra/platform@0.3.0
  - @stackra/seo@0.3.0
  - @stackra/settings@0.3.0
  - @stackra/testing@0.3.0
  - @stackra/ui@0.3.0
  - @stackra/validation@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [2d5a888]
- Updated dependencies [1a9259b]
- Updated dependencies [5fa1a15]
- Updated dependencies [9085c41]
- Updated dependencies [3d18ae6]
- Updated dependencies [6f67da8]
- Updated dependencies [c4f295e]
  - @stackra/errors@0.2.0
  - @stackra/iam@0.2.0
  - @stackra/contracts@0.2.0
  - @stackra/platform@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/clients@0.2.0
  - @stackra/settings@0.2.0
  - @stackra/seo@0.2.0
  - @stackra/icons@0.2.0
  - @stackra/testing@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/i18n@0.2.0
  - @stackra/validation@0.2.0
  - @stackra/feature-flags@0.2.0

## 0.1.0

### Minor Changes

- 2787c1e: Add `@stackra/navigation` (absorbs `@stackra/router`): the `Route`, `Layout` and `Menu({ kind })` kinds with typed
  `RouteContext`, `MetaContext` and `RouteProps`, `routeRef` and the route table, `ChromeConfig`, the React Router 7
  adapters (`toRoot`, `toLayout`, `toRoute`, `routeAdapter`, `routeContext`), router-aware `Link`, `NavLink` and hooks
  in the visitor's locale mount, the breadcrumb trail (`BreadcrumbsProvider`, `useBreadcrumb`, `useBreadcrumbs`), the
  root error boundary, the React Navigation adapters (`toScreen`, `useLayoutLoader`, `ContextMenu`) and the test
  helpers `renderRoute`, `renderLayout`, `runRouteLoader`, `runRouteSubmit` and `routeMeta`.
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.
- 69e90f1: Wave 6: the shared shell contracts of `@stackra/ui` (navigation item, landmark, bar slots, title block and layout
  breakpoint) and the new `@stackra/navigation` package that holds the router bindings (ADR 0317).
  
  `@stackra/ui` adds `AppShell`, `Sidebar`, `NavigationList`, `AppHeader`, `PageHeader`, `Section`,
  `SingleColumnLayout`, `TwoColumnLayout`, `Screen` and `NavigationHeader` for web and native, and the native `TabBar`,
  with their contracts.
  
  `@stackra/navigation` adds `./contracts`, `./react` (React Router 7) and `./native` (React Navigation 7): `RouteOverlay`
  with `useRouteOverlay`, the router providers that fill the kit's link seam, and `RouteLeaveConfirmation`.

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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 90957bd: Breaking renames for unique public names (STA-1383): `@stackra/platform` `Capability` is `PlatformCapability` (iam's
  `Capability` is the permission capability), and the `@stackra/platform/contracts` port `PushTransport` (this device's
  push registration) is `PlatformPushTransport`, keyed `platform.PlatformPushTransport` (notifications' `PushTransport`
  is the server send). Drivers keep their names; importers in peripherals and navigation are updated.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- 69e90f1: Keyboard and accessibility fixes found by the first end-to-end run of waves 6 and 7:
  
  - `Table` walks its cells with the arrow keys and lands on a cell's link or button, so a `DataTable` row menu is reachable from the keyboard. HeroUI's "tab" navigation left it out of reach.
  - `RadioGroup` reads an empty `value` or `defaultValue` as "nothing chosen", so the group keeps a Tab stop.
  - `DatePicker` shows narrow weekday names, so the Arabic calendar fits its grid.
  - `NavigationList` draws the current entry's bar as an element, so its text's contrast can be measured.
  - `EntityPicker` draws one remove button per tag.
  - `RouteOverlay` gives focus back to its opener after Escape closes it.
- Updated dependencies [0202770]
- Updated dependencies [2787c1e]
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
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [9771f30]
- Updated dependencies [76f882d]
- Updated dependencies [2787c1e]
- Updated dependencies [0a38324]
- Updated dependencies [6f2c1f7]
- Updated dependencies [e1dde33]
- Updated dependencies [6d04650]
- Updated dependencies [2787c1e]
- Updated dependencies [d9d5187]
- Updated dependencies [fd1a986]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [9fa447e]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [3a94a6e]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [de4d77d]
- Updated dependencies [cc96d5d]
- Updated dependencies [d63f012]
- Updated dependencies [072dc7e]
- Updated dependencies [b58ebce]
- Updated dependencies [1723c05]
- Updated dependencies [d15a219]
- Updated dependencies [8ce76e9]
- Updated dependencies [c46f32f]
- Updated dependencies [2c2beca]
- Updated dependencies [9e63234]
- Updated dependencies [04a0f8c]
- Updated dependencies [544b42d]
- Updated dependencies [2787c1e]
- Updated dependencies [90957bd]
- Updated dependencies [1b4effa]
- Updated dependencies [6855121]
- Updated dependencies [d7ed271]
- Updated dependencies [3b19f6d]
- Updated dependencies [074d3e8]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [ca44233]
- Updated dependencies [2787c1e]
- Updated dependencies [56dde43]
- Updated dependencies [786f390]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [69363bf]
- Updated dependencies [9759078]
- Updated dependencies [fd13f0e]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [e344058]
- Updated dependencies [2787c1e]
- Updated dependencies [a65c6bc]
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
  - @stackra/config@0.1.0
  - @stackra/platform@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/feature-flags@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/i18n@0.1.0
  - @stackra/icons@0.1.0
  - @stackra/seo@0.1.0
  - @stackra/settings@0.1.0
  - @stackra/testing@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
