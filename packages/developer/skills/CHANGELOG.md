# @stackra/skills

## 0.32.0

### Patch Changes

- @stackra/contracts@0.32.0

## 0.31.0

### Patch Changes

- @stackra/contracts@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [8c17109]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0

## 0.29.0

### Patch Changes

- @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/contracts@0.28.0

## 0.27.0

### Patch Changes

- @stackra/contracts@0.27.0

## 0.26.0

### Patch Changes

- @stackra/contracts@0.26.0

## 0.25.0

### Patch Changes

- @stackra/contracts@0.25.0

## 0.24.0

### Patch Changes

- @stackra/contracts@0.24.0

## 0.23.0

### Patch Changes

- @stackra/contracts@0.23.0

## 0.22.0

### Patch Changes

- @stackra/contracts@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0

## 0.20.0

### Patch Changes

- @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0

## 0.18.1

### Patch Changes

- @stackra/contracts@0.18.1

## 0.18.0

### Patch Changes

- @stackra/contracts@0.18.0

## 0.17.2

### Patch Changes

- @stackra/contracts@0.17.2

## 0.17.1

### Patch Changes

- @stackra/contracts@0.17.1

## 0.17.0

### Patch Changes

- @stackra/contracts@0.17.0

## 0.16.0

### Patch Changes

- @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/contracts@0.15.0

## 0.14.4

### Patch Changes

- @stackra/contracts@0.14.4

## 0.14.3

### Patch Changes

- @stackra/contracts@0.14.3

## 0.14.2

### Patch Changes

- @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/contracts@0.14.1

## 0.14.0

### Patch Changes

- @stackra/contracts@0.14.0

## 0.13.0

### Patch Changes

- @stackra/contracts@0.13.0

## 0.12.0

### Patch Changes

- @stackra/contracts@0.12.0

## 0.11.1

### Patch Changes

- @stackra/contracts@0.11.1

## 0.11.0

### Patch Changes

- @stackra/contracts@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0

## 0.9.0

### Minor Changes

- cbbe4e3: Add the `docs` registry kind (STA-1920, ADR 0514 decision 10). `StackraKind.Docs` is a product's content-only docs
  package, `@figentra/<product>-docs`: MDX pages and their Fumadocs `meta.json` in `content/`, plus assets, with no code.
  `STACKRA_MANIFEST_SCHEMA` accepts `{ "kind": "docs" }` with nothing more. `pnpm validate` places a docs package at the
  repository's `docs/`, asks for no tier, turbo.jsonc or tsconfig, requires `content/`, and treats it as UNLICENSED like
  an app. `stackra add` never installs one: the docs hub depends on it.

### Patch Changes

- Updated dependencies [2e43c48]
  - @stackra/contracts@0.9.0

## 0.8.0

### Patch Changes

- @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/contracts@0.7.1

## 0.7.0

### Patch Changes

- @stackra/contracts@0.7.0

## 0.6.1

### Patch Changes

- @stackra/contracts@0.6.1

## 0.6.0

### Patch Changes

- @stackra/contracts@0.6.0

## 0.5.1

### Patch Changes

- @stackra/contracts@0.5.1

## 0.5.0

### Patch Changes

- @stackra/contracts@0.5.0

## 0.4.0

### Minor Changes

- 1ba7227: `connectors` is a package category: one provider's Integration and Connection classes per package, `packages/connectors/<provider>`, tier lib. `CATEGORIES`, `StackraCategory`, the scaffold and the manifest schema accept it.
- aa21e6b: Gen reads a consumed service from a sibling folder or from a dependency whose `package.json` has `stackra.kind`
  `contract` (a producer's published `stackra.manifest.json`, OpenAPI and lang, no source) and whose manifest `member` is
  the service, never by matching a dependency's member name, which could pick a package's manifest for a service of the
  same name. A contract package is never hosted. Its client and lang are generated; a listener of its events is refused
  with `client_event_remote_transport` until the event-transport ADR. `StackraKind` gains `contract` (a new kind, so
  skills is minor); `stackra add` does not offer it; repo-checks asks a contract package only for its kind and manifest.

### Patch Changes

- ff56870: The container's missing-binding error now ends with a hint to run `stackra gen` first when a test hits it (gen's setup
  registers the member's wiring). The bundled rule and skills no longer say the v3 packages "do not ship yet", and the
  migrations skill says to write migrations by hand until `stackra db diff` exists (STA-1808).
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
  - @stackra/contracts@0.4.0

## 0.3.0

### Patch Changes

- d22a5eb: The licence's copyright holder is the registered entity Figentra Technologies L.L.C. (owner decision of 2026-10-30, STA-1678);
  the MIT terms, the package names and the product names do not change.
- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/contracts@0.3.0

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0

## 0.1.0

### Minor Changes

- 6a03936: Member metadata for people and agents (ADR 0453 decision 11, amendment of 2026-10-27, STA-1072). `@stackra/skills`
  adds the `package` kind's `tier`, `category`, `runtimes` and `summary` to `StackraManifest` and
  `STACKRA_MANIFEST_SCHEMA`, with the vocabularies `StackraTier`, `StackraCategory` and `StackraRuntime`.
  `@stackra/repo-checks` adds `checkMemberMetadata` (keywords, repository, homepage, bugs, author, engines, the `stackra`
  field against the folder and its turbo tags), `npmMetadataFor`, `turboTagsFor` and `MEMBER_METADATA`, run by the
  `structure` phase in the Stackra repository. `stackra new` writes the field, the tags and `--summary`.
- 2787c1e: Add `@stackra/skills`, the agent-neutral source of Stackra's open conventions (ADR 0282, 0286): the neutral format
  for skills, rules, sub-agents, commands and hooks as Markdown with strict frontmatter, names derived from the path;
  `parseAgentDocument`, `AgentDocumentKind`, `HookEvent` and `AgentDocumentInvalidError` in `.`; `loadSkillSet` in
  `./node`, which reads the shipped `assets/` set (the naming, boundary, HTTP, versions, tenancy, service and
  not-built-yet rules and the v3 authoring skills) or any other root, in a stable order.
- 55e2558: Add the `./contracts` entry for Stackra registry items (ADR 0453 decision 11, STA-1336): `StackraKind` (`package`,
  `skill`, `agent`, `mcp`, `plugin`), `StackraManifest` (the `stackra` field), `CatalogueItem` and `CataloguePage` (the
  catalogue API), `ItemsLock` and `ItemsLockEntry` (`stackra-items.lock.yaml`), their zod 4 schemas and
  `ITEM_PACKAGE_NAME_PATTERN` (`@<scope>/<kind>-<name>`).
- 49c7944: Breaking rename for unique public names (STA-1383): the `stackra` field type of a registry item's `package.json` in
  `@stackra/skills/contracts` is `StackraPackageField`, so `StackraManifest` is only `@stackra/contracts`' type of a
  member's committed `stackra.manifest.json`. `STACKRA_MANIFEST_SCHEMA` keeps its name.

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
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/contracts@0.1.0

Written by Changesets on release; never edited by hand.
