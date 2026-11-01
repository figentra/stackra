# @stackra/repo-checks

<!--
Stackra file contract:
Purpose: the package's reader guide: the repository checks `stackra check` runs, their phases and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0282 (decision 3); ADR 0007; ADR 0022; ADR 0294; ADR 0403; ADR 0461.
-->

The repository checks every Stackra repo runs through `stackra check`, as typed functions over the git file list. They
were core-only scripts (`tools/scripts/validate-repository.mjs`, `doc-standard.mjs`, `catalogue-completeness.mjs` and
the tables of `structure.mjs`); they live here so a product gets them with `@stackra/cli` instead of copying them.
`pnpm validate` runs them through `stackra validate --repository` and `stackra doc-standard`.

**Tier:** `tier:lib` (`packages/developer/repo-checks`). One entry, `./node`. Depends on `yaml` and `typescript6` (the
TypeScript 6 compiler API the doc standard parses with).

## Phases

| Phase (`stackra check`) | Runner              | Checks                                                                                                             |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `config`                | `configFindings`    | JSON vs JSONC vs YAML (`MUST_STAY_JSON`, `MUST_STAY_JSONC`), YAML flow maps, `.stackra/*` ignored                  |
| `structure`             | `structureFindings` | test placement, runway schemas and files, imports, raw SQL reasons, Expo form factor, members' manifests and files |
| `docs`                  | `docsFindings`      | contract headers, TSDoc on exports and members, no types in doc tags (ADR 0007)                                    |
| `catalogues`            | `catalogueFindings` | lang catalogues complete per locale, ICU placeholders match `en` (ADR 0403)                                        |
| `spec`                  | `specFindings`      | spec stage gates, foreign-status, bug and lane gates, trace and drift (ADR 0120, 0198); see below                  |

Each runner takes a `RepoContext` (`readRepoContext(root)`: the root and its git file list, or, when git cannot list it, the files `walkRepoFiles`
finds honouring `.gitignore`) and returns `RawFinding`s
(`{ rule, dir, text }`, the text the old scripts printed). `toFinding(phase, raw)` locates one as a `Finding`
(`{ phase, tool, rule, path, line, column, message, severity, fixable, adr }`), the shape `stackra check --format json`
prints.

The single checks stay exported (`checkMember`, `checkMemberFiles`, `checkMemberMetadata` (the npm metadata, the
`stackra` field and its turbo tags of ADR 0453 decision 11, run in the Stackra repository only, with the built
`STACKRA_MANIFEST_SCHEMA` of `@stackra/skills`), `checkExports`, `checkService`,
`checkTestPlacement`, `checkJsonConfigs`, `checkRunwaySchemas`, `checkRunwayFiles`, `checkYamlFlowMaps`,
`checkImports`, `checkRawSql`, `checkIosFormFactor`, `checkWindowSizing`, `checkDocFile`, `checkCatalogues`, `checkGitignore`, `checkIgnoredGoldens` (a file under `__golden__` that git ignores), `checkAdrNumbers`), and so
do the structure tables (`CATEGORIES`, `ENTRIES`, `MODULE_GROUPS`, `APP_GROUPS`, `PACKAGE_FOLDERS`, `MEMBER_ROOT`,
`KIND_FOLDERS`, `BANNED_FOLDERS`, `TEST_TIERS`, …) and their lookups.

`checkMember` refuses any `@stackra-pro/*` dependency in every member, apps included (`PRO_SCOPE`): the Pro packages
live in figentra/stackra-pro (ADR 0461). It refuses HeroUI Pro (`PRO_DEPENDENCIES`) in every member too, apps
included: Stackra ships free HeroUI and its own components only (ADR 0469).

`checkRawSql` (rule `raw-sql`, ADR 0160 decision 1, stackra-288) holds every raw SQL call in member source (not tests):
an `.execute(...)` with a literal statement, or a `raw(...)` imported from the ORM or `@stackra/database`, carries a
`// raw-sql: <why>` comment on its line, inside its statement, or in the comment lines directly above the statement.
`RAW_SQL_BASELINE` lists the calls that had no reason when the check landed, per file; it only goes down.

## Spec checks

`specFindings` is the read-only spec check set, published so any repository with `.agents/specs` runs it through
`stackra check` (the `spec` phase). It takes the base ref, the branch, whether the PR is ready for review and four
injected functions (`git`, `exists`, `read`, `list`), and returns `Finding`s with the rule `spec-gate` or `spec-trace` and
the spec folder as the path. It runs the stage gate of every spec folder changed since the base, refuses a path under a
root `specs/`, then the foreign-status, bug-lane and lane gates, then the trace rules (drift from Implementing, drift and
`@covers` coverage at Done). The pieces are exported too: `specCheckStage`, `specCheckClarified`, `specCheckPlan`,
`specCheckTasks`, `specCheckLane`, `specCheckForeignStatus`, `specCheckBug`, `specTrace`, `specTraceProblems`, `specDrift`
and the parsers (`specParseTasks`, `specDefinedIds`, `specCoversTags`, …).

A spec folder is `<prefix>-<n>-<slug>` and its issue key is `<PREFIX>-<n>` (`os-12-billing` is `OS-12`). A key in a branch, a
`Refs:` trailer, a `[KEY-n]` task tag or an `@covers <prefix>-<n>:ID` tag counts only for the prefixes the repository's
existing spec folders use (`specPrefixesOf`); a lone `word-123` is never a key. With no spec folder yet, the lane gate waits.
The Figentra-only parts (the branch-name check, the spec-kit tripwire, the Linear calls) are not here; they stay in core's
`tools/scripts`. The `spec-*` files are loaded by core's wrappers with plain `node`, so they import each other by relative
`.ts` paths and use erasable TypeScript only, like coding-standard's plugin files (ADR 0421 decision 2).

## Not here yet

- The new checks the 2026-10-27 coverage audit lists (`kind-path`, `folder-shape`, `banned-folders`, `imports-map`,
  `member-root`, `adr-lint`, `changeset-required`, …): each lands as a function here with its phase.
- The Linear side of the spec workflow (`spec-linear.mjs`, `plan` and `stage` comments, the branch-name check and the
  spec-kit tripwire) stays in core's `tools/scripts`; only the read-only checks are published (see Spec checks).
- The structure checks still carry core's naming (`@figentra/<app>`, `@stackra/<package>`) and core paths (the runway
  member, the docs app); a product that runs the `structure` phase today gets core's rules.
