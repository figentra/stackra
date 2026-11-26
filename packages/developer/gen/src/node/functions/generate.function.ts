/**
 * Stackra file contract:
 * Purpose: `generate`, one gen-core run over a member: discovery, the pure `generateMember`, then either writing the
 *          files (creating folders) or, with `check`, comparing them with what is on disk, which is
 *          `stackra gen --check` (a stale or missing file, the committed `stackra.manifest.json` included, or a changed
 *          identity without `@Renamed`, fails it; for a package so does a package.json `files` that leaves the manifest
 *          out, `manifest_unshipped`, since a host reads it under node_modules, STA-1308). With
 *          `pass: "manifests"` it writes the manifest alone (`stackra gen --manifests`, the first pass of a workspace
 *          run); otherwise a refused run that consumes another service writes its client files first and runs again,
 *          since a shape typed with a client's enum only resolves once that client is on disk, and when it is still
 *          refused writes its manifest if only consumed workspace services stand in the way.
 * Boundary: writes only under the member root; a check writes nothing. A refused run writes nothing but the client
 *           files (when the clients target itself is clean) and the manifest (when the manifest pass is clean). The
 *           committed `stackra.manifest.json` is read first, so its identities stay locked. An authored root
 *           `vitest.config.ts` (no generated notice) is never overwritten: one that imports `./.stackra/vitest.config`
 *           is kept and the shim skipped; any other is refused as `shim_authored` (STA-1296, STA-1297), and the root
 *           `tsdown.config.ts` the same way when gen writes a tsdown config (STA-1306). A root `*.extend.ts` hatch
 *           outside the closed set (vite, expo, metro, desktop, pwa) or without
 *           a `Reason:` header is refused as `tool_reason_missing` (STA-1306); whether a hatch changes an owned key is
 *           not checked, since gen does not apply hatches yet. A docs app (`src/config/docs.config.ts`) and, since
 *           ADR 0514 amendment of 2026-11-09, a docs member (`"stackra": { "kind": "docs" }`, the second input) take
 *           the docs-site run instead (`generateDocsSite`, STA-1316): it has no module graph, writes only
 *           `.stackra/site/`, and its manifest pass writes nothing. A service's full run also writes
 *           `encore.app` at the member root from the root runway's `providers.encore.app` (`encore_app_missing` without
 *           it), and any run refuses an `encore.app` at the repository root (`encore_app_stray`, STA-1322).
 *           A service's full run also refuses a job queue its `runway.yaml` leaves out of an environment
 *           (`queue_unprovisioned`, STA-1727).
 *           A service's full run also writes its compiled migrations to `.stackra/migrations` (`compileMigrations`,
 *           stackra-248) and removes any `.sql` file there it did not produce; `--check` reports a stale, missing or
 *           leftover one.
 *           A package or service with an `.int.test.ts` under `src/` also gets `.stackra/vitest.int.config.ts`, the
 *           unit config narrowed to the integration tier (`emitIntTierConfig`, STA-1819).
 *           A package with a `.e2e.page.tsx` under `src/` also gets `.stackra/e2e/` (a Vite app that renders the page)
 *           and `.stackra/playwright.e2e.config.ts` (`emitE2ePageFiles`, ADR 0022 amendment of 2026-11-09).
 *           A clean full run also returns its warnings (`client_event_unsubscribed`, `checkSubscriptions`, STA-1910).
 *           A member that declares a resource has each tree read through `loader` before the manifest is built
 *           (`readResourceTrees`); with no loader it is refused as `resource_loader_missing` (STA-1947).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 10 and 22: the committed manifest and `stackra gen --check`); ADR 0295
 *                     (decision 5: generated files are overwritten); ADR 0261; ADR 0260 (a cycle between services is
 *                     allowed at the manifest level); ADR 0091 (decision 2) and ADR 0029 (the Encore app file); ADR 0159
 *                     (the compiled migrations); ADR 0514 (amendment of 2026-11-09: the docs member).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { StackraManifest } from "@stackra/contracts";

import { DOCS_CONFIG_FILE } from "#core/constants/docs-config-file.constant";
import { GENERATED_NOTICE } from "#core/constants/generated-notice.constant";
import { MIGRATIONS_DIR } from "#core/constants/migrations-dir.constant";
import { PACKAGE_ENTITIES_FILE } from "#core/constants/package-entities-file.constant";
import { ROOT_DTS_TSCONFIG } from "#core/constants/root-dts-tsconfig.constant";
import { emitE2ePageFiles } from "#core/functions/emit-e2e-page-files.function";
import { emitIntTierConfig } from "#core/functions/emit-int-tier-config.function";
import { emitMigrationsCheck } from "#core/functions/emit-migrations-check.function";
import { checkSubscriptions } from "#core/functions/check-subscriptions.function";
import { encoreMigrationSql } from "#core/functions/encore-migration-sql.function";
import { encoreServiceFolder } from "#core/functions/encore-service-folder.function";
import { generateMember } from "#core/functions/generate-member.function";
import type { GenError } from "#core/types/gen-error.type";
import type { GeneratedFile } from "#core/types/generated-file.type";
import { compileMigrations } from "#node/functions/compile-migrations.function";
import { discoverMember } from "#node/functions/discover-member.function";
import { encoreApp } from "#node/functions/encore-app.function";
import { generateDocsSite } from "#node/functions/generate-docs-site.function";
import { hasE2ePages } from "#node/functions/has-e2e-pages.function";
import { isDocsMember } from "#node/functions/is-docs-member.function";
import { hasIntTests } from "#node/functions/has-int-tests.function";
import { readResourceTrees } from "#node/functions/read-resource-trees.function";
import { runwayQueues } from "#node/functions/runway-queues.function";
import type { GenerateResult } from "#node/types/generate-result.type";
import type { ModuleLoader } from "#node/types/module-loader.type";

/** The committed manifest at the member root. */
const MANIFEST_FILE = "stackra.manifest.json";

/** The tool configs gen writes under `.stackra/` that an authored root config may only merge, never replace. */
const TOOL_CONFIGS = ["vitest", "tsdown"] as const;

/** The closed set of code hatches at the member root (ADR 0295 decision 6, `desktop` after ADR 0326, `pwa`). */
const HATCHES = new Set(["vite", "expo", "metro", "desktop", "pwa"]);

/** The comments a file opens with, and the `Reason:` header a hatch carries among them. */
const LEADING_COMMENTS = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*/;
const LEADING_REASON = /\breason:/i;

/** An authored root config that imports the generated one (`./.stackra/<tool>.config`, with or without `.ts`). */
const mergesGenerated = (tool: string, source: string): boolean =>
  new RegExp(`["']\\./\\.stackra/${tool}\\.config(?:\\.ts)?["']`).test(source);

/** One whole-file refusal at the member root. */
const refusal = (code: string, file: string, message: string, fix: string): GenError => ({
  code,
  file,
  line: 0,
  column: 0,
  subject: file,
  message,
  fix,
});

/**
 * The `*.extend.ts` hatches at `root` that gen refuses (`tool_reason_missing`, STA-1306): one outside the closed set,
 * or one that does not open with a `Reason:` header. Whether a hatch changes an owned key is not checked yet.
 */
function hatchErrors(root: string): GenError[] {
  const errors: GenError[] = [];
  for (const file of readdirSync(root)
    .filter((name) => name.endsWith(".extend.ts"))
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort()) {
    const tool = file.slice(0, -".extend.ts".length);
    if (!HATCHES.has(tool))
      errors.push(
        refusal(
          "tool_reason_missing",
          file,
          `${file} is not a code hatch gen knows: the closed set is ${[...HATCHES].map((name) => `${name}.extend.ts`).join(", ")}`,
          "move the setting into its typed section of stackra.config.ts, or into one of the known hatches",
        ),
      );
    else if (
      !LEADING_REASON.test(LEADING_COMMENTS.exec(readFileSync(join(root, file), "utf8"))?.[0] ?? "")
    )
      errors.push(
        refusal(
          "tool_reason_missing",
          file,
          `${file} does not open with a \`Reason:\` header`,
          `open ${file} with a comment saying why stackra.config.ts cannot express it: \`// Reason: <why>\``,
        ),
      );
  }
  return errors;
}

/** The files a member commits (ADR 0294 R10, a package's entity list since STA-1874); the rest is gitignored output. */
const COMMITTED = new Set([MANIFEST_FILE, "openapi.json", PACKAGE_ENTITIES_FILE]);

/**
 * The paths of `files` that differ from disk under `root`, written unless `check`. A check passes a missing file that
 * is not committed: a clean clone has no gitignored output until gen runs (STA-1742).
 */
function write(root: string, files: readonly GeneratedFile[], check: boolean): string[] {
  const changed: string[] = [];
  for (const file of files) {
    const path = join(root, file.path);
    const current = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    if (current === file.content) continue;
    if (check && current === undefined && !COMMITTED.has(file.path)) continue;
    changed.push(file.path);
    if (check) continue;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content);
  }
  return changed;
}

/** The merged `Blueprint` augmentation `compileMigrations` writes for a service's own macros. */
const BLUEPRINT_FILE = ".stackra/gen/blueprint.ts";

/**
 * The `.sql` files in `.stackra/migrations` this run did not produce (a renumbered or removed migration), deleted
 * unless `check`, so the runner never applies a stale file; with `compiled` (the migrations ran), also a leftover
 * `.stackra/gen/blueprint.ts`, which would import a deleted macro. `--check` reports them as changed.
 */
function staleMigrations(
  root: string,
  files: readonly GeneratedFile[],
  check: boolean,
  compiled: boolean,
): string[] {
  const dir = join(root, MIGRATIONS_DIR);
  const kept = new Set(files.map((file) => file.path));
  const stale = (existsSync(dir) ? readdirSync(dir) : [])
    .filter((name) => name.endsWith(".sql"))
    .map((name) => `${MIGRATIONS_DIR}/${name}`)
    .filter((path) => !kept.has(path));
  if (compiled && !kept.has(BLUEPRINT_FILE) && existsSync(join(root, BLUEPRINT_FILE)))
    stale.push(BLUEPRINT_FILE);
  if (!check) for (const path of stale) rmSync(join(root, path));
  return stale;
}

/**
 * Runs gen-core on the member at `root`.
 *
 * @param root - the member root.
 * @param options - `check` compares instead of writing; `backend` picks the TypeScript host; `pass: "manifests"`
 *                  writes the manifest alone; `loader` imports the member's resource classes (`stackra gen` passes one).
 * @throws Error when package.json, tsconfig.json or a dependency manifest cannot be read.
 * @example
 * const { errors, changed } = await generate("packages/commerce/loyalty-kit", { check: true });
 */
export async function generate(
  root: string,
  options: {
    readonly check?: boolean;
    readonly backend?: "tsgo" | "ts6";
    readonly pass?: "manifests";
    readonly loader?: ModuleLoader;
    /** The staged checks refuse instead of warning; default `STACKRA_GEN_STRICT=1` (STAGED_REFUSAL_CODES). */
    readonly strict?: boolean;
  } = {},
): Promise<GenerateResult> {
  const strict = options.strict ?? process.env["STACKRA_GEN_STRICT"] === "1";
  // A docs app or a docs member has no classes to discover: its run assembles the site (ADR 0002, 2026-10-27
  // amendment; ADR 0514 amendment of 2026-11-09).
  if (existsSync(join(root, DOCS_CONFIG_FILE)) || isDocsMember(root))
    return options.pass === "manifests"
      ? { errors: [], files: [], changed: [] }
      : generateDocsSite(root, options.check === undefined ? {} : { check: options.check });
  // The resource trees are read once, from the first discovery; a rediscovery after writing clients keeps them.
  let trees: Awaited<ReturnType<typeof readResourceTrees>>["trees"];
  const discover = async () => {
    const found = await discoverMember(
      root,
      options.backend === undefined ? {} : { backend: options.backend },
    );
    return trees === undefined ? found : { ...found, resourceTrees: trees };
  };
  const manifestPath = join(root, MANIFEST_FILE);
  const previous = existsSync(manifestPath)
    ? (JSON.parse(readFileSync(manifestPath, "utf8")) as StackraManifest)
    : undefined;
  const check = options.check === true;
  let ir = await discover();
  const read = await readResourceTrees(root, ir, options.loader);
  if (read.errors.length > 0) return { errors: read.errors, files: [], changed: [] };
  if (read.trees !== undefined) {
    trees = read.trees;
    ir = { ...ir, resourceTrees: trees };
  }
  let result = generateMember(
    ir,
    previous,
    options.pass === undefined ? { strict } : { pass: options.pass, strict },
  );
  const partial: string[] = [];
  if (result.errors.length > 0 && !check && options.pass === undefined) {
    const clients = generateMember(ir, previous, { pass: "clients", strict });
    if (clients.errors.length === 0) partial.push(...write(root, clients.files, false));
    if (partial.length > 0) {
      ir = await discover();
      result = generateMember(ir, previous, { strict });
    }
    // Still refused: the manifest alone, when only workspace services still to come stand in its way.
    const manifest =
      result.errors.length > 0
        ? generateMember(ir, previous, { pass: "manifests", strict })
        : undefined;
    if (manifest?.errors.length === 0) partial.push(...write(root, manifest.files, false));
  }
  // A warning of the full pass prints beside the outcome and never blocks it (STA-340).
  const warnings = result.warnings ?? [];
  if (result.errors.length > 0)
    return { errors: result.errors, warnings, files: [], changed: partial };
  // A package ships its manifest: a host's gen reads it under node_modules (ADR 0158, STA-1308).
  if (check && ir.layout === "package") {
    const { files } = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      readonly files?: unknown;
    };
    if (Array.isArray(files) && !files.includes(MANIFEST_FILE))
      return {
        errors: [
          {
            code: "manifest_unshipped",
            file: "package.json",
            line: 0,
            column: 0,
            subject: "files",
            message: `package.json \`files\` leaves out ${MANIFEST_FILE}, so a host cannot read this package's drivers, configs and identities`,
            fix: `add "${MANIFEST_FILE}" to \`files\` in package.json`,
          },
        ],
        warnings,
        files: [],
        changed: partial,
      };
  }
  // An authored root tool config is never overwritten. One that merges the generated config is kept (and the vitest
  // shim is not written); any other is refused (STA-1296, STA-1297; every generated tool config since STA-1306). A
  // code hatch outside the closed set or without its `Reason:` header is refused too.
  // The Encore app file of a service, from the root runway's `providers.encore.app`; a stray encore.app at the repository root
  // is refused (STA-1322).
  // A v2 service (authored src/main.ts, STA-344) is not an Encore app yet, so it gets no encore.app.
  const encore = encoreApp(
    root,
    ir.layout === "service" && ir.authoredMain !== true && options.pass === undefined,
  );
  // The compiled migrations of a service, its declared packages' included (ADR 0159, stackra-248). A package with
  // migrations of its own gets them too, with what they build on, beside the generated check that applies, reverts and
  // re-applies them (STA-1689); not in `.stackra/migrations`, so its tests' memory database still builds from entities.
  const ownMigrations = join(root, "src/node/database/migrations");
  const checked =
    ir.layout === "package" &&
    existsSync(ownMigrations) &&
    readdirSync(ownMigrations).some((name) => name.endsWith(".migration.ts"));
  const migrations =
    (ir.layout === "service" || checked) && options.pass === undefined
      ? await compileMigrations(root, ir)
      : { files: [], errors: [] };
  // Every job queue but `default` is provisioned in each environment of the service's runway (STA-1727).
  const queues =
    ir.layout === "service" && options.pass === undefined
      ? runwayQueues(root, result.manifest)
      : [];
  const migrationFiles = checked
    ? [
        ...migrations.files.map((file) => ({
          ...file,
          path: file.path.replace(`${MIGRATIONS_DIR}/`, ".stackra/tests/migrations/"),
        })),
        ...(migrations.files.length > 0 ? emitMigrationsCheck(ir) : []),
      ]
    : migrations.files;
  // Encore reads migrations only from a local folder, so a
  // service's compiled files are copied under its Encore service too. Encore runs each file in one transaction, so
  // an online step's copy builds in its plain form (ADR 0159, amendment of 2026-11-10).
  const encoreFiles =
    encore.files.length === 0
      ? []
      : [
          ...encore.files,
          ...migrations.files.map((file) => ({
            ...file,
            path: file.path.replace(
              `${MIGRATIONS_DIR}/`,
              `${encoreServiceFolder(ir.member)}/migrations/`,
            ),
            content: encoreMigrationSql(file.content),
          })),
        ];
  const errors = [...hatchErrors(root), ...encore.errors, ...migrations.errors, ...queues];
  let files = [...result.files, ...encoreFiles, ...migrationFiles];
  // A member with an `.int.test.ts`, its own or gen's, gets the integration-tier config beside the unit one
  // (`stackra test --tier int`), so the generated tenant-isolation test runs with no authored int test beside it.
  if (
    files.some((file) => file.path === ".stackra/vitest.config.ts") &&
    hasIntTests(
      root,
      files.map((file) => file.path),
    )
  )
    files.push(emitIntTierConfig(ir.package));
  // A package with a `<name>.e2e.page.tsx` gets the Vite app that renders it and the Playwright config that runs the
  // `.e2e.test.ts` specs against it (`stackra test --tier e2e`; ADR 0022, 2026-11-09).
  if (ir.layout === "package" && hasE2ePages(root)) files.push(...emitE2ePageFiles(ir.package));
  for (const tool of TOOL_CONFIGS) {
    const config = `${tool}.config.ts`;
    if (
      !files.some((file) => file.path === `.stackra/${config}`) ||
      !existsSync(join(root, config))
    )
      continue;
    const authored = readFileSync(join(root, config), "utf8");
    if (authored.includes(GENERATED_NOTICE)) continue;
    if (!mergesGenerated(tool, authored))
      errors.push(
        refusal(
          "shim_authored",
          config,
          `an authored ${config} sits at the member root and does not import ./.stackra/${tool}.config, so the generated config never loads`,
          `import the generated config and merge it: \`import generated from "./.stackra/${tool}.config"\` and extend it, or delete the file so gen writes the shim`,
        ),
      );
    // An authored root config that loads the generated one is kept, and the shim is not written over it; an authored
    // tsdown config sets its own `dts`, so the declaration tsconfig goes with the shim.
    else
      files = files.filter(
        (file) => file.path !== config && !(tool === "tsdown" && file.path === ROOT_DTS_TSCONFIG),
      );
  }
  if (
    files.some((file) => file.path === ROOT_DTS_TSCONFIG) &&
    existsSync(join(root, ROOT_DTS_TSCONFIG)) &&
    !readFileSync(join(root, ROOT_DTS_TSCONFIG), "utf8").includes(GENERATED_NOTICE)
  )
    errors.push(
      refusal(
        "shim_authored",
        ROOT_DTS_TSCONFIG,
        `an authored ${ROOT_DTS_TSCONFIG} sits at the member root, where gen writes the declaration build's tsconfig`,
        "delete it so gen writes it, or author a root tsdown.config.ts that imports ./.stackra/tsdown.config.ts and sets its own `dts`",
      ),
    );
  // The Expo config is gen's alone: an authored app.json or app.config.ts at the root would shadow or be overwritten.
  if (files.some((file) => file.path === "app.config.ts")) {
    if (existsSync(join(root, "app.json")))
      errors.push(
        refusal(
          "shim_authored",
          "app.json",
          "an authored app.json sits beside the generated Expo config, so two files state the app's Expo settings",
          "move its settings into the `expo` section of defineApp (gen writes the owned keys) and delete app.json",
        ),
      );
    if (
      existsSync(join(root, "app.config.ts")) &&
      !readFileSync(join(root, "app.config.ts"), "utf8").includes(GENERATED_NOTICE)
    )
      errors.push(
        refusal(
          "shim_authored",
          "app.config.ts",
          "an authored app.config.ts sits at the member root, where gen writes the Expo config shim",
          "move its settings into the `expo` section of defineApp and delete the file",
        ),
      );
  }
  if (errors.length > 0) return { errors, warnings, files: [], changed: partial };
  // A listener of a contract-only producer's event that the producer's contract does not subscribe (STA-1910): a
  // warning, and a refusal under strict, which writes nothing.
  const unsubscribed = options.pass === undefined ? checkSubscriptions(ir, strict) : [];
  if (strict && unsubscribed.length > 0)
    return { errors: unsubscribed, warnings, files: [], changed: partial };
  result = { ...result, files };
  const reported = [...warnings, ...unsubscribed];
  return {
    errors: [],
    files: result.files,
    ...(reported.length > 0 ? { warnings: reported } : {}),
    changed: [
      ...new Set([
        ...partial,
        ...write(root, result.files, check),
        ...staleMigrations(
          root,
          result.files,
          check,
          ir.layout === "service" && options.pass === undefined,
        ),
      ]),
    ],
  };
}
