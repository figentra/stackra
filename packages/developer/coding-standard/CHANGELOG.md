# @stackra/coding-standard

## 0.2.0

### Patch Changes

- 36701cb: `stackra/no-tenant-vocabulary` exempts a product's tenancy service (`services/tenancy/`), which implements tenancy as `@stackra/tenancy` does.

## 0.1.0

### Minor Changes

- 2787c1e: New package with the Stackra house lint rules as one oxlint plugin, `stackra`. It checks that a class extends the
  base its file suffix names, one declaration per file, blank lines between class members, one option per line in
  decorators and kind factories, no empty, kind-named, retired or parameter decorators, no empty module files, no
  `enum` or `#private`, hook file names, class member order, reasons on disable comments and the shape of TSDoc
  blocks. Three rules autofix.
- e344058: Add the rules `file-contract` (the `Stackra file contract:` docblock on every file), `no-tenant-vocabulary` (no
  `tenant` in identifiers outside `@stackra/tenancy`) and `no-raw-key-literal` (no string literals in icon, column-key,
  route-key and permission positions) to the `stackra` oxlint plugin.

### Patch Changes

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
- b5187cf: Turn on every `stackra/*` house rule at error in the oxlint base preset, loading `@stackra/coding-standard` from its
  source file (ADR 0421), and add kebab-case file names, the retired `@Injectable`/`@Inject`/`define*` import ban,
  cross-service bans and the package entry direction (contracts, core, node/react/native, testing) to the presets.
  `consistent-type-imports` is no longer turned off for packages and apps in `boundaries.jsonc`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.

Written by Changesets on release; never edited by hand.
