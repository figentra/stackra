# @stackra/coding-standard

The Stackra house lint rules, shipped as one oxlint JS plugin named `stackra`. They check the code conventions
(ADR 0128, 0129) and the programming model v3.1 grammar (ADR 0294, 0305) that oxlint's built-in rules cannot.

**Tier:** `tier:lib` (`packages/developer/coding-standard`). No workspace dependency and no runtime dependency: the
plugin is plain objects and pure functions over the syntax tree oxlint hands it.

## Use it

Add the plugin to an oxlint config and turn on the rules you want. The plugin registers rules; it enables none.

```jsonc
{
  "jsPlugins": ["@stackra/coding-standard"],
  "rules": {
    "stackra/base-matches-suffix": "error",
    "stackra/lines-between-class-members": "error",
    "stackra/one-declaration-per-file": "error",
  },
}
```

Run `oxlint --fix` to apply the autofixes. The rules take no options.

In this repository the oxlint base preset (`@stackra/oxlint-config`) loads the plugin from its source file and turns
every rule on at `error` (ADR 0421), so lint needs no built dist. Other repositories load the built package as above.

## Entry points

| Import                     | Holds                                                          |
| -------------------------- | -------------------------------------------------------------- |
| `@stackra/coding-standard` | `STACKRA_PLUGIN` (also the default export, which oxlint loads) |

The package has the one entry `.` (ADR 0127, 2026-10-24 note). Until `stackra gen` writes the entry barrels
(STA-339), the export names the plugin's file.

## Rules

| Rule                          | Checks                                                                                                          | Fix | Source               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- | --- | -------------------- |
| `base-matches-suffix`         | A class in `<name>.<kind>.ts` extends that kind's base (`cancel-order.action.ts` extends `Action`)              | no  | ADR 0294 R3, STA-338 |
| `lines-between-class-members` | One blank line between class members                                                                            | yes | ADR 0294 R9, STA-338 |
| `multiline-decorator-options` | Decorator and base-factory option objects with 2+ properties put one property per line                          | yes | ADR 0294 R9, STA-338 |
| `no-empty-decorator`          | No `@X()` or `@X({})`: write `@X` or drop it                                                                    | no  | ADR 0294 R6, STA-338 |
| `no-kind-decorator`           | No decorator named after a kind (`@Action`) or retired (`@Injectable`, `@Inject`, `@Cron`)                      | no  | ADR 0294 R6, STA-340 |
| `no-parameter-decorator`      | No decorator on a parameter; the parameter type names the dependency                                            | no  | ADR 0294 R6, STA-340 |
| `one-declaration-per-file`    | A file exports one declaration (an enum's const and type count once; re-exports do not count)                   | no  | ADR 0305 r10-13      |
| `no-empty-module`             | No `<key>.module.ts` whose class states nothing gen cannot derive                                               | no  | ADR 0305 r15         |
| `no-enum`                     | No TypeScript `enum`; use `Enum.of({ ... })`                                                                    | no  | ADR 0128 d1          |
| `no-hash-private`             | No `#private` members; use `private`                                                                            | no  | ADR 0128 d3          |
| `hook-file-name`              | An exported `use<Name>` lives in `use-<name>.ts(x)`                                                             | no  | ADR 0128 d5          |
| `member-order`                | Static fields, decorated fields, instance fields, constructor, static methods, accessors, hooks, methods        | no  | ADR 0128, 0268 R1    |
| `disable-needs-reason`        | A disable comment names its rules and gives a reason after `--`                                                 | no  | ADR 0129             |
| `docblock-shape`              | One line of TSDoc text is written `/** ... */`; a block with a tag is multi-line                                | yes | owner R-11           |
| `file-contract`               | Every file opens with the `Stackra file contract:` docblock: Purpose, Boundary, Runtime, Governing contract     | no  | owner H              |
| `no-tenant-vocabulary`        | No declaration of a `tenant` identifier outside tenancy and IAM scope code (uses allowed); use `ScopeRef`       | no  | ADR 0323, R-59       |
| `no-raw-key-literal`          | No string literal in an `icon`, `columnKey`, `routeKey` or `permission(s)` property; use the generated constant | no  | owner R-56, ADR 0322 |

### What the rules do not check

- Where a file sits (`kind-path`), member roots, entries and names (`*Guard`, abbreviations): those are validator
  checks in `validate-repository.mjs`.
- Whether a base resolves to a registered `@stackra/*` kind, class names (`kind_class_name`) and identities: those
  are gen checks.
- Which kinds a decorator may target (`facet-target`): it needs gen's decorator registry.

### Known limits

- `base-matches-suffix` reads names, not imports. It accepts an override's `Base<Name>` alias, a class of the same
  kind (a name ending in `PascalCase(kind)`, such as a package's config class or an `Error`) and, for a schema, a
  sibling schema imported by a relative or `#` path. Two placements are exempt by path: a driver in
  `@stackra/contracts` extends its port imported by a local path (the package sits below `@stackra/container`, so
  `Driver(port)` is out of reach), and a class with no base in a `.service.ts` file under a package's `src/testing/`
  is a test harness, not a container binding. Framework classes that build the kinds (the container itself, the action
  pipeline) disable it per line with a reason.
- A disable comment with no rule list (`// oxlint-disable-line`) may suppress its own `disable-needs-reason`
  finding, because oxlint applies the directive before reporting.
- `docblock-shape` collapses a block only when the one-line form fits the 100-column print width.

## Tasks

| Task            | Command                                                |
| --------------- | ------------------------------------------------------ |
| `build`         | `tsdown`                                               |
| `typecheck`     | `tsc --noEmit`                                         |
| `lint`          | `oxlint .`                                             |
| `test`          | `vitest run` (rules run through oxlint's `RuleTester`) |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70)        |
| `format`        | `oxfmt --write .`                                      |
| `format:check`  | `oxfmt --check .`                                      |
| `clean`         | `rm -rf dist coverage .turbo`                          |

Run one with `pnpm turbo run <task> --filter=@stackra/coding-standard`.
