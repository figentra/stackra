# @stackra/theming

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
- Updated dependencies [c4f295e]
  - @stackra/contracts@0.2.0
  - @stackra/ui@0.2.0
  - @stackra/assets@0.2.0
  - @stackra/tokens@0.2.0
  - @stackra/storage@0.2.0
  - @stackra/config@0.2.0
  - @stackra/container@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

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
- 2787c1e: Add `@stackra/theming`, the colour scheme and the look of a member. `ThemingConfig` (`theming`) with its shipped
  schema `ThemingConfig$` holds the theme by name, the logo source (an asset key or entry), the schemes on offer and the
  first one, the theme colour and splash background per scheme, self-hosted fonts and the tenant colour switch, with
  defaults from the `stackra` theme of `@stackra/tokens`. `ColorSchemeService` keeps the user's choice in the `prefs`
  storage area, resolves `system` through the new `SystemColorScheme` port (`./contracts`) and notifies on change; its
  drivers are `MemorySystemColorSchemeDriver` (`.`), `BrowserSystemColorSchemeDriver` (`./browser`) and
  `AppearanceSystemColorSchemeDriver` (`./native`). `useColorScheme` (`./react`) returns `{ scheme, resolved, setScheme }`
  on web and native and never mismatches on hydration. `ColorScheme` is re-exported from `@stackra/ui/contracts`.
  `fakeColorScheme` (`./testing`) seeds a real service for tests, and English and Arabic labels ship for the scheme names.

### Patch Changes

- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [0061a8e]
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
- Updated dependencies [dfa0c6a]
- Updated dependencies [9277eeb]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [d8ea8c2]
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
- Updated dependencies [8992b7a]
- Updated dependencies [d156aa8]
- Updated dependencies [2787c1e]
- Updated dependencies [1271b88]
- Updated dependencies [e99b97a]
- Updated dependencies [d44e69c]
- Updated dependencies [5c23791]
- Updated dependencies [12fe727]
- Updated dependencies [d82cd1a]
- Updated dependencies [3a7615d]
- Updated dependencies [3f61d95]
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
  - @stackra/assets@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/tokens@0.1.0
  - @stackra/ui@0.1.0
  - @stackra/storage@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
