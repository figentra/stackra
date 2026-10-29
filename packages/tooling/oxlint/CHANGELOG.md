# @stackra/oxlint-config

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
