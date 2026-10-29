# @stackra/cli

## 0.1.0

### Minor Changes

- 55e2558: Add `stackra add <kind> <name>[@version]` (ADR 0453, STA-1336): resolves the item in the Stackra registry catalogue
  (`@stackra`, then `@stackra-pro`), checks its tarball's integrity, installs a skill, agent, MCP server or plugin into
  its target (a package through `pnpm add`) and pins it in `stackra-items.lock.yaml`. Add `stackra publish`, which
  checks `stackra.kind` and the `@<scope>/<kind>-<name>` name before `pnpm publish` to the registry. The registry origin
  is a setting (`--registry`, `STACKRA_REGISTRY`, the workspace `.npmrc`, default `https://npm.stackra.figentra.com/`).
  New dependency: `@stackra/skills`.
- 3c548d9: Add `stackra audit:verify <bundle.jsonl> [--key <keys.json>]`, the offline check of an audit proof bundle: every link
  rehashes to its hash and follows the one before, and every checkpoint is ES256-signed by a trusted key and matches its
  link (ADR 0212 decision 3, ADR 0416). Seed packs may now hold `fee-schedule`, `rate-card` and `checklist-template`
  records (ADR 0391, RV-22).
- e344058: Add `stackra db migrate` (applies the member's pending migrations in order, the release step) and `stackra db rollback`
  (reverts the last batch; refused unless the target is a dev, preview or test database). Both run in the member's context
  through its own `@stackra/database/node`, imported dynamically, so the CLI does not bundle MikroORM.
- 640c0dd: `stackra new package|service` names the member from `--scope` (a product key or `@npm-scope`) or the root runway's
  `product.key` (`@figentra/<product>-service-<name>`, ADR 0349 decision 2), writes the stackra/template shape (`#src`
  and `#assets` imports, the `./assets/*` export, `catalog:stackra` versions in a product repository), and gains
  `--over`, which regenerates over an existing member: only missing files are written and authored files get a printed
  diff; `CHANGELOG.md`, `runway.yaml` and `src/` are never touched (STA-1210).
- 2787c1e: Add `@stackra/cli`, the `stackra` binary, thin first. `stackra gen [--check]` runs gen-core on a member or on every
  `stackra.config.ts` member at the workspace root and prints each refusal with its fix. `stackra dev|build|start|
  typecheck|test|lint` run gen, then the member's tool with the config gen wrote into `.stackra/`: Vite, Expo, tsdown,
  Wrangler, the generated Encore app, Mintlify, vitest, Playwright, Maestro, tsc and oxlint, chosen by layout and target;
  at the workspace root they run `turbo run <task>`. `stackra ls [section]` lists the identities a committed manifest
  locks. `stackra mcp`, `stackra mcp sync`, `stackra mcp exec --`, `stackra agents sync` and `stackra agents check`
  wire `@stackra/mcp`. The old `console` command framework is folded in as a small `node:util` `parseArgs` core.
- 145435d: `stackra dev` runs a product with no app members locally. `--surface <s> --os <checkout>` starts the local shell's own
  Vite, which serves the product packages' `./<surface>` entries from source with hot reload (and a landing site's seed
  document from `content`), so gen's bundle mode is no longer needed for a local shell. `--mobile <app> --os <checkout>
  --device <udid>` prepares the app from its template line with Runway's `prepareMobileDev`, prebuilds it and runs a
  Release build on the iOS simulator. `--product --os <checkout>` runs every surface and mobile app of the root runway.
- 6ad4813: Add `stackra settings:diff` and `stackra settings:apply`, which run a settings pack against a scope node through the
  member's `@stackra/settings/node`; `stackra seed-pack` now runs without `--check` against `@stackra/database/node`'s
  seed runner.
- 37e1aa8: Docs site target (stackra-176): gen assembles a docs app's Mintlify root into `.stackra/site` from a typed `DocsConfig`
  (pages in `src/docs`, assets in `src/assets`, snippets in `src/snippets`) with the `docs_*` refusals; `stackra
  dev|build|lint` run Mintlify in the generated site; runway's `MintlifyProviderDriver` (now a `Driver(RunwayProvider)`,
  so runway depends on `@stackra/container`) publishes it as an orphan commit to `targets.mintlify.branch`.
- 2c05f14: Gen runs in two passes so services that consume each other's clients in a cycle can bootstrap (STA-1232). Pass 1
  writes every member's `stackra.manifest.json` without its clients (a consumed service in the same workspace is no
  longer a refusal there); pass 2 writes the clients and the rest against those manifests, in rounds until one writes
  nothing. A refused run still writes its clients and, when only workspace services stand in the way, its manifest.
  New: `stackra gen --manifests` (pass 1 alone), `generate(root, { pass: "manifests" })`, `generateMember(..., { pass })`,
  `emitClients(ir, { pending })` and `MemberIR.workspaceServices`.
- 6a03936: Member metadata for people and agents (ADR 0453 decision 11, amendment of 2026-10-27, STA-1072). `@stackra/skills`
  adds the `package` kind's `tier`, `category`, `runtimes` and `summary` to `StackraManifest` and
  `STACKRA_MANIFEST_SCHEMA`, with the vocabularies `StackraTier`, `StackraCategory` and `StackraRuntime`.
  `@stackra/repo-checks` adds `checkMemberMetadata` (keywords, repository, homepage, bugs, author, engines, the `stackra`
  field against the folder and its turbo tags), `npmMetadataFor`, `turboTagsFor` and `MEMBER_METADATA`, run by the
  `structure` phase in the Stackra repository. `stackra new` writes the field, the tags and `--summary`.
- a1eb70f: A product with no app members builds and deploys from its CI: `stackra build --product [--dry-run]` builds every
  surface's extension bundle against its shell line's import map and every mobile app's EAS build, and writes
  `dist/product/build.json`; `stackra deploy --product --env <environment>` publishes the bundles and host rows, lists
  the landing seeds, submits the mobile builds, and waits on the environment's approval (`--approved`). Runway adds
  `buildProduct`, `deployProduct`, `workspacePackages` and `exportSourceOf`; the mobile job takes `buildOnly` and `packages`.
- 68ae29e: Search index registry and reindex jobs (ADR 0404 d3, ADR 0221 d7): `search.indexes` with `SearchIndexState`,
  `SearchIndexRegistry` (`list`, `invalidateChanged`, `begin`/`progress`/`finish`), `searchFacetHashOf`, resumable
  `SearchIndex.reindex({ after, since, onBatch })`, the `reindexSearch` and `reindexSemantic` work that the reindex jobs
  of `@stackra/data-maintenance` run, and the `stackra search:reindex [Model] [--scope-id --scope-path] [--since]
  [--semantic]` and `stackra search:status` commands through the member's `searchReindex` (of
  `@stackra/data-maintenance/node`) and `searchStatus` runners.
- 659b103: Add `stackra new <package|service|seed-pack> <name>`, which writes members in the programming model v3 shape and
  product seed pack skeletons, and `stackra seed-pack <product>`, which checks a `seed-pack:<product>` (`--check`) or
  seeds its `minimal`, `demo` or `test` profile through the member's seed runner, writing only new and changed
  seed-owned records and never a record a tenant changed.

### Patch Changes

- 6f757ed: `stackra new service` declares `@stackra/app` and `@stackra/container`, which the server entry and the Encore app gen
  writes import, so a fresh service passes
  `stackra gen`'s generated-dependency check. `stackra build` in a package gen wrote no entry for, with no tsdown config of
  its own, says there is nothing to build and exits 0 instead of failing in tsdown.
- c2da3a7: `stackra search:reindex` loads `searchReindex` from the member's `@stackra/data-maintenance/node`, where the reindex
  jobs now live; `stackra search:status` still loads `searchStatus` from `@stackra/search/node` and needs no add-on.
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
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 49c7944: Breaking rename for unique public names (STA-1383): the `stackra` field type of a registry item's `package.json` in
  `@stackra/skills/contracts` is `StackraPackageField`, so `StackraManifest` is only `@stackra/contracts`' type of a
  member's committed `stackra.manifest.json`. `STACKRA_MANIFEST_SCHEMA` keeps its name.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [854d7a9]
- Updated dependencies [0abe92d]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [62c7ae1]
- Updated dependencies [37e1aa8]
- Updated dependencies [cc8db5e]
- Updated dependencies [bbec10c]
- Updated dependencies [c857043]
- Updated dependencies [0a38324]
- Updated dependencies [9fa326c]
- Updated dependencies [3840889]
- Updated dependencies [3730669]
- Updated dependencies [fb11778]
- Updated dependencies [f55eced]
- Updated dependencies [9c799c4]
- Updated dependencies [165fae0]
- Updated dependencies [957fe36]
- Updated dependencies [cda22dd]
- Updated dependencies [a45aec8]
- Updated dependencies [727e5f7]
- Updated dependencies [783fb5b]
- Updated dependencies [401d703]
- Updated dependencies [a3611b4]
- Updated dependencies [2562581]
- Updated dependencies [cac7c42]
- Updated dependencies [d5b457f]
- Updated dependencies [2c78113]
- Updated dependencies [2787c1e]
- Updated dependencies [ca33793]
- Updated dependencies [c868bad]
- Updated dependencies [640ae17]
- Updated dependencies [7cbd46d]
- Updated dependencies [0f3325f]
- Updated dependencies [d7c5bf2]
- Updated dependencies [8c52f12]
- Updated dependencies [4f92d09]
- Updated dependencies [1ab0f73]
- Updated dependencies [2c05f14]
- Updated dependencies [780b049]
- Updated dependencies [a78c614]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [2787c1e]
- Updated dependencies [835e1d2]
- Updated dependencies [1c6c2e2]
- Updated dependencies [6a03936]
- Updated dependencies [830ea4a]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [954bf08]
- Updated dependencies [0a20a9f]
- Updated dependencies [8b38906]
- Updated dependencies [1b4effa]
- Updated dependencies [a1eb70f]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3b19f6d]
- Updated dependencies [de58cb5]
- Updated dependencies [3047b44]
- Updated dependencies [512884e]
- Updated dependencies [a32b62d]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [3ccd0ab]
- Updated dependencies [769adee]
- Updated dependencies [4135a5a]
- Updated dependencies [c927e35]
- Updated dependencies [29c2d3e]
- Updated dependencies [2787c1e]
- Updated dependencies [8d304d6]
- Updated dependencies [e344058]
- Updated dependencies [a183131]
- Updated dependencies [fbf8fa4]
- Updated dependencies [4ea8dd0]
- Updated dependencies [3a5d71d]
- Updated dependencies [3649655]
- Updated dependencies [c526bed]
- Updated dependencies [fd13f0e]
- Updated dependencies [2787c1e]
- Updated dependencies [55e2558]
- Updated dependencies [49c7944]
- Updated dependencies [fa41d2d]
- Updated dependencies [088998e]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [5e8114b]
- Updated dependencies [8a1be69]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
- Updated dependencies [d19a3d5]
  - @stackra/gen@0.1.0
  - @stackra/config@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/runway@0.1.0
  - @stackra/mcp@0.1.0
  - @stackra/repo-checks@0.1.0
  - @stackra/skills@0.1.0
  - @stackra/support@0.1.0

Written by Changesets on release; never edited by hand.
