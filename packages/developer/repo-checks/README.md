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
the tables of `structure.mjs`); they live here so a product gets them with `@stackra/cli` instead of copying them. Core
keeps thin wrappers in `tools/scripts`, so `pnpm validate` still runs them with plain `node`.

**Tier:** `tier:lib` (`packages/developer/repo-checks`). One entry, `./node`. Depends on `yaml` and `typescript6` (the
TypeScript 6 compiler API the doc standard parses with).

## Phases

| Phase (`stackra check`) | Runner              | Checks                                                                                                             |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `config`                | `configFindings`    | JSON vs JSONC vs YAML (`MUST_STAY_JSON`, `MUST_STAY_JSONC`), YAML flow maps, `.stackra/*` ignored                  |
| `structure`             | `structureFindings` | test placement, runway schemas and files, imports, raw SQL reasons, Expo form factor, members' manifests and files |
| `docs`                  | `docsFindings`      | contract headers, TSDoc on exports and members, no types in doc tags (ADR 0007)                                    |
| `catalogues`            | `catalogueFindings` | lang catalogues complete per locale, ICU placeholders match `en` (ADR 0403)                                        |

Each runner takes a `RepoContext` (`readRepoContext(root)`: the root and its git file list, or, when git cannot list it, the files `walkRepoFiles`
finds honouring `.gitignore`) and returns `RawFinding`s
(`{ rule, dir, text }`, the text the old scripts printed). `toFinding(phase, raw)` locates one as a `Finding`
(`{ phase, tool, rule, path, line, column, message, severity, fixable, adr }`), the shape `stackra check --format json`
prints.

The single checks stay exported (`checkMember`, `checkMemberFiles`, `checkMemberMetadata` (the npm metadata, the
`stackra` field and its turbo tags of ADR 0453 decision 11, run in the Stackra repository only, with the built
`STACKRA_MANIFEST_SCHEMA` of `@stackra/skills`), `checkExports`, `checkService`,
`checkTestPlacement`, `checkJsonConfigs`, `checkRunwaySchemas`, `checkRunwayFiles`, `checkYamlFlowMaps`,
`checkImports`, `checkRawSql`, `checkIosFormFactor`, `checkWindowSizing`, `checkDocFile`, `checkCatalogues`, `checkGitignore`), and so
do the structure tables (`CATEGORIES`, `ENTRIES`, `MODULE_GROUPS`, `APP_GROUPS`, `PACKAGE_FOLDERS`, `MEMBER_ROOT`,
`KIND_FOLDERS`, `BANNED_FOLDERS`, `TEST_TIERS`, …) and their lookups.

`checkMember` refuses any `@stackra-pro/*` dependency in every member, apps included (`PRO_SCOPE`): the Pro packages,
`@stackra-pro/ui` among them, live in figentra/stackra-pro (ADR 0461). HeroUI Pro (`PRO_DEPENDENCIES`) stays apps-only
(ADR 0310).

`checkRawSql` (rule `raw-sql`, ADR 0160 decision 1, stackra-288) holds every raw SQL call in member source (not tests):
an `.execute(...)` with a literal statement, or a `raw(...)` imported from the ORM or `@stackra/database`, carries a
`// raw-sql: <why>` comment on its line, inside its statement, or in the comment lines directly above the statement.
`RAW_SQL_BASELINE` lists the calls that had no reason when the check landed, per file; it only goes down.

## Not here yet

- The new checks the 2026-10-27 coverage audit lists (`kind-path`, `folder-shape`, `banned-folders`, `imports-map`,
  `member-root`, `adr-lint`, `changeset-required`, …): each lands as a function here with its phase.
- The spec gates (`spec-gate`, `spec-trace`) stay in core's `tools/scripts`: they read Linear branch names, a
  Figentra-internal workflow (ADR 0282 decision 4). `stackra check` runs them when a repository has them.
- The structure checks still carry core's naming (`@figentra/<app>`, `@stackra/<package>`) and core paths (the runway
  member, the docs app); a product that runs the `structure` phase today gets core's rules.
