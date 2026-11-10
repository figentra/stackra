# @stackra/oxlint-config

## 0.33.0

### Patch Changes

- @stackra/feature-flags@0.33.0
  - @stackra/coding-standard@0.33.0

## 0.32.0

### Patch Changes

- @stackra/feature-flags@0.32.0
  - @stackra/coding-standard@0.32.0

## 0.31.0

### Patch Changes

- @stackra/coding-standard@0.31.0
  - @stackra/feature-flags@0.31.0

## 0.30.0

### Patch Changes

- @stackra/feature-flags@0.30.0
  - @stackra/coding-standard@0.30.0

## 0.29.0

### Patch Changes

- @stackra/feature-flags@0.29.0
  - @stackra/coding-standard@0.29.0

## 0.28.0

### Patch Changes

- @stackra/coding-standard@0.28.0
  - @stackra/feature-flags@0.28.0

## 0.27.0

### Patch Changes

- @stackra/coding-standard@0.27.0
  - @stackra/feature-flags@0.27.0

## 0.26.0

### Patch Changes

- @stackra/coding-standard@0.26.0
  - @stackra/feature-flags@0.26.0

## 0.25.0

### Patch Changes

- @stackra/coding-standard@0.25.0
  - @stackra/feature-flags@0.25.0

## 0.24.0

### Patch Changes

- @stackra/coding-standard@0.24.0
  - @stackra/feature-flags@0.24.0

## 0.23.0

### Patch Changes

- @stackra/coding-standard@0.23.0
  - @stackra/feature-flags@0.23.0

## 0.22.0

### Patch Changes

- @stackra/coding-standard@0.22.0
  - @stackra/feature-flags@0.22.0

## 0.21.0

### Patch Changes

- @stackra/feature-flags@0.21.0
  - @stackra/coding-standard@0.21.0

## 0.20.0

### Patch Changes

- @stackra/feature-flags@0.20.0
  - @stackra/coding-standard@0.20.0

## 0.19.0

### Patch Changes

- @stackra/feature-flags@0.19.0
  - @stackra/coding-standard@0.19.0

## 0.18.1

### Patch Changes

- @stackra/coding-standard@0.18.1
  - @stackra/feature-flags@0.18.1

## 0.18.0

### Patch Changes

- @stackra/coding-standard@0.18.0
  - @stackra/feature-flags@0.18.0

## 0.17.2

### Patch Changes

- @stackra/coding-standard@0.17.2
  - @stackra/feature-flags@0.17.2

## 0.17.1

### Patch Changes

- @stackra/coding-standard@0.17.1
  - @stackra/feature-flags@0.17.1

## 0.17.0

### Patch Changes

- @stackra/coding-standard@0.17.0
  - @stackra/feature-flags@0.17.0

## 0.16.0

### Patch Changes

- @stackra/feature-flags@0.16.0
  - @stackra/coding-standard@0.16.0

## 0.15.0

### Patch Changes

- @stackra/coding-standard@0.15.0
  - @stackra/feature-flags@0.15.0

## 0.14.4

### Patch Changes

- @stackra/coding-standard@0.14.4
  - @stackra/feature-flags@0.14.4

## 0.14.3

### Patch Changes

- @stackra/coding-standard@0.14.3
  - @stackra/feature-flags@0.14.3

## 0.14.2

### Patch Changes

- @stackra/feature-flags@0.14.2
  - @stackra/coding-standard@0.14.2

## 0.14.1

### Patch Changes

- @stackra/coding-standard@0.14.1
  - @stackra/feature-flags@0.14.1

## 0.14.0

### Patch Changes

- @stackra/coding-standard@0.14.0
  - @stackra/feature-flags@0.14.0

## 0.13.0

### Patch Changes

- @stackra/coding-standard@0.13.0
  - @stackra/feature-flags@0.13.0

## 0.12.0

### Patch Changes

- @stackra/coding-standard@0.12.0
  - @stackra/feature-flags@0.12.0

## 0.11.1

### Patch Changes

- @stackra/coding-standard@0.11.1
  - @stackra/feature-flags@0.11.1

## 0.11.0

### Patch Changes

- @stackra/coding-standard@0.11.0
  - @stackra/feature-flags@0.11.0

## 0.10.0

### Minor Changes

- 33c1abd: New house rule `stackra/no-raw-env` (ADR 0173 amendment 2026-11-04, STA-2104): a named read of `process.env` or
  `import.meta.env` outside configuration classes, generated code, tooling and tests is reported, so every name is
  declared once in a `Config({ schema, env })` class or with `@Secret`. The base preset turns it on at `warn` while the
  current reads migrate; it moves to `error` with the last one.

### Patch Changes

- Updated dependencies [33c1abd]
  - @stackra/coding-standard@0.10.0
  - @stackra/feature-flags@0.10.0

## 0.9.0

### Patch Changes

- @stackra/feature-flags@0.9.0
  - @stackra/coding-standard@0.9.0

## 0.8.0

### Patch Changes

- @stackra/feature-flags@0.8.0
  - @stackra/coding-standard@0.8.0

## 0.7.1

### Patch Changes

- @stackra/coding-standard@0.7.1
  - @stackra/feature-flags@0.7.1

## 0.7.0

### Patch Changes

- @stackra/coding-standard@0.7.0
  - @stackra/feature-flags@0.7.0

## 0.6.1

### Patch Changes

- @stackra/coding-standard@0.6.1
  - @stackra/feature-flags@0.6.1

## 0.6.0

### Patch Changes

- @stackra/coding-standard@0.6.0
  - @stackra/feature-flags@0.6.0

## 0.5.1

### Patch Changes

- @stackra/coding-standard@0.5.1
  - @stackra/feature-flags@0.5.1

## 0.5.0

### Patch Changes

- @stackra/coding-standard@0.5.0
  - @stackra/feature-flags@0.5.0

## 0.4.0

### Minor Changes

- c9cf403: `react/rules-of-hooks` is off for `.tsx` files in the component homes (`components/`, `blocks/`, `routes/`, a package's
  `react/` and `native/`, `*.mail.tsx`), so a class component's hook fields pass as ADR 0305 rules 37, 38 and 41 allow;
  hook files (`use-*`), every `.ts` file and tests keep the rule.
- 6a07e7a: `import/no-cycle` is off in a module's model files (`**/src/**/models/*.ts`), so a two-way relation
  (`@ManyToOne(() => Order)` and `@OneToMany(() => OrderLine)`) no longer fails; a cycle through any other file still
  fails at that file.

### Patch Changes

- Updated dependencies [c9cf778]
- Updated dependencies [9c8d108]
  - @stackra/coding-standard@0.4.0
  - @stackra/feature-flags@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
  - @stackra/coding-standard@0.3.0
  - @stackra/feature-flags@0.3.0

## 0.2.0

### Patch Changes

- 7b8a004: Fixes two bugs that broke consumers of 0.1.0 outside this repository:
  
  - `@stackra/oxlint-config` loaded its JS plugins by monorepo-relative source paths, so `oxlint` failed with "Failed to
    load JS plugin" in every other repository. `base.jsonc` now loads them through two shipped loaders
    (`src/plugins/*.mjs`). Each one imports the plugin's source inside this repository and the published package
    (`@stackra/coding-standard`, `@stackra/feature-flags/lint`) everywhere else. Both packages are peers.
  - `@stackra/builder/react` and `@stackra/collaboration/react` import `yjs`, but declared it as an optional peer, so a
    consumer without it failed with "Cannot find package 'yjs'". `yjs` is now a required peer.
- Updated dependencies [36701cb]
  - @stackra/coding-standard@0.2.0
  - @stackra/feature-flags@0.2.0

## 0.1.0

### Minor Changes

- 9771f30: Turn on `feature-flags/no-plan-targeting` in the oxlint base preset, loading the plugin from its source file so lint
  needs no build (ADR 0421).
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
- 954bf08: Enforce the ORM boundary and the raw SQL reason (gap mo23, ADR 0097 amendment of 2026-10-29). `boundaries.jsonc`
  bans `@mikro-orm/*` imports outside `@stackra/database`; `@stackra/model` may take `Collection`, `Ref` and `Reference`
  from `@mikro-orm/core`, and its ORM adapters the rest. `checkRawSql` (rule `raw-sql` in the structure phase) holds
  every raw SQL call in member source to a `// raw-sql:` reason (ADR 0160), with `RAW_SQL_BASELINE` as a ratchet for
  the calls that had none.
- b5187cf: Turn on every `stackra/*` house rule at error in the oxlint base preset, loading `@stackra/coding-standard` from its
  source file (ADR 0421), and add kebab-case file names, the retired `@Injectable`/`@Inject`/`define*` import ban,
  cross-service bans and the package entry direction (contracts, core, node/react/native, testing) to the presets.
  `consistent-type-imports` is no longer turned off for packages and apps in `boundaries.jsonc`.

### Patch Changes

- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- 4bf756f: Preset sources move into each package's `src/`. The public export specifiers are unchanged
  (`@stackra/typescript-config/node`, `@stackra/vitest-config/coverage`, …). An oxlint consumer that extends a preset by
  file path now points at `@stackra/oxlint-config/src/<preset>.jsonc`.
- Updated dependencies [2787c1e]
- Updated dependencies [e344058]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [b5187cf]
- Updated dependencies [e756399]
  - @stackra/coding-standard@0.1.0

Written by Changesets on release; never edited by hand.
