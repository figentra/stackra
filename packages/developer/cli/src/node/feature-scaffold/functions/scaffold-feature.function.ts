/**
 * Stackra file contract:
 * Purpose: `scaffoldFeature(options)`, the feature kinds of `stackra new`, run inside a service: `module` (a new module
 *          folder with its first model), `model` (a model, its create migration, service, view and permissions),
 *          `migration` (the next migration of a module, adding nullable columns to one of its tables and the matching
 *          fields to its model), `action` and `query` (`<verb>-<model>`, with schemas and a unit test, and the action's
 *          L2 permission added to the model's Permissions class). Each declares the packages its files import in the
 *          service's package.json, with the version spec the service already uses for `@stackra/*`.
 * Boundary: writes only inside the service: the new files, the Permissions class or model it extends, and
 *           package.json. Refuses before writing anything when a file it would create exists, a name is not
 *           kebab-case, the module or model is missing (or, for `module`, already there). `dryRun` writes nothing.
 *           Never installs or runs gen; the next steps say to. The written files are formatted with the oxfmt the
 *           workspace installs (`node_modules/.bin/oxfmt` between the service and the workspace root), as `scaffold`
 *           formats a member; without one, a note says to. In a service that runs `@stackra/tenancy` a new
 *           model is tenant-owned unless `global`.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3); ADR 0294 (decisions 13, 20 and 21); ADR 0305; ADR 0159 (as amended);
 *                     ADR 0239 (decision 1); ADR 0135 (rule 2); ADR 0099 and STA-2096 (the L2 write floor); ADR 0136.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { PUBLIC_ID_PREFIXES } from "@stackra/gen";
import { camelCase, snakeCase } from "@stackra/support";

import { CliUsageError } from "#node/errors/cli-usage.error";
import { actionFiles } from "#node/feature-scaffold/functions/action-files.function";
import { appendMembers } from "#node/feature-scaffold/functions/append-members.function";
import { contractHeader } from "#node/feature-scaffold/functions/contract-header.function";
import { decoratorNames } from "#node/feature-scaffold/functions/decorator-names.function";
import { derivePrefix } from "#node/feature-scaffold/functions/derive-prefix.function";
import { ensureImport } from "#node/feature-scaffold/functions/ensure-import.function";
import { migrationFiles } from "#node/feature-scaffold/functions/migration-files.function";
import { modelFiles } from "#node/feature-scaffold/functions/model-files.function";
import { modelNames } from "#node/feature-scaffold/functions/model-names.function";
import { nextMigrationNumber } from "#node/feature-scaffold/functions/next-migration-number.function";
import { parseFields } from "#node/feature-scaffold/functions/parse-fields.function";
import { propertyLines } from "#node/feature-scaffold/functions/property-lines.function";
import { queryFiles } from "#node/feature-scaffold/functions/query-files.function";
import { readModel } from "#node/feature-scaffold/functions/read-model.function";
import { resolveMember } from "#node/feature-scaffold/functions/resolve-member.function";
import { singular } from "#node/feature-scaffold/functions/singular.function";
import { FEATURE_KINDS } from "#node/feature-scaffold/constants/feature-kinds.constant";
import type { FeatureOptions } from "#node/feature-scaffold/types/feature-options.type";
import type { FeatureResult } from "#node/feature-scaffold/types/feature-result.type";
import { cliVersion } from "#node/functions/cli-version.function";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { TemplateFile } from "#node/types/template-file.type";

/** A kebab-case name. */
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The packages each kind's files import, as dependencies: `zod` for the schemas gen compiles from the shapes. */
const RUNTIME: Readonly<Record<string, readonly string[]>> = {
  model: [
    "@stackra/contracts",
    "@stackra/database",
    "@stackra/iam",
    "@stackra/model",
    "@stackra/validation",
    "zod",
  ],
  migration: ["@stackra/database"],
  action: ["@stackra/actions", "@stackra/contracts", "@stackra/validation", "zod"],
  query: ["@stackra/actions", "@stackra/contracts", "@stackra/validation", "zod"],
};

/**
 * The packages gen's generated wiring imports once a service has these pieces, so the first `stackra gen` after the
 * scaffold passes `generated_dependency_missing`: the console entry of `@stackra/database`'s commands (a model), and
 * the event bus and queues the action pipeline runs on (an action or query).
 */
const WIRING: Readonly<Record<string, readonly string[]>> = {
  model: ["@stackra/console"],
  migration: [],
  action: ["@stackra/events", "@stackra/queue"],
  query: ["@stackra/events", "@stackra/queue"],
};

/** What gen's wiring imports for a service that runs `@stackra/tenancy` (its actions, events, queues and crons). */
const TENANCY_WIRING: readonly string[] = [
  "@stackra/actions",
  "@stackra/events",
  "@stackra/queue",
  "@stackra/scheduler",
];

/** The test packages each kind's tests import, as dev dependencies (the database ones are `@stackra/database`'s peers). */
const TESTING: Readonly<Record<string, readonly string[]>> = {
  model: [
    "@stackra/testing",
    "@electric-sql/pglite",
    "@electric-sql/pglite-pgvector",
    "@mikro-orm/pglite",
  ],
  migration: [
    "@stackra/testing",
    "@electric-sql/pglite",
    "@electric-sql/pglite-pgvector",
    "@mikro-orm/pglite",
  ],
  action: ["@stackra/container", "@stackra/testing"],
  query: ["@stackra/container", "@stackra/testing"],
};

/** A package manifest's dependency maps. */
type Manifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} & Record<string, unknown>;

/** Every `*.model.ts` file under `folder`. */
function modelFilesUnder(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".model.ts"))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** The kebab-case models a module declares, from its `models/` folder. */
function modelsOf(moduleFolder: string): string[] {
  const folder = join(moduleFolder, "models");
  return existsSync(folder)
    ? readdirSync(folder)
        .filter((file) => file.endsWith(".model.ts"))
        .map((file) => file.slice(0, -".model.ts".length))
    : [];
}

/** The Permissions file of a model with only `verb` at `level`, for a module that has none yet. */
function permissionsFile(
  names: ReturnType<typeof modelNames>,
  verb: string,
  level: string,
): string {
  const words = names.snake.replaceAll("_", " ");
  return [
    contractHeader({
      purpose: `\`${names.className}Permissions\`, the permissions of the ${words} model: \`${names.schema}.${names.snake}.<verb>\`, each with its risk.`,
      boundary:
        "statics only; the value is the risk. The key is derived from the module, the class (minus `Permissions`) and the static. A query reads `read`; each action adds its own verb at L2 or above.",
      runtime: "isomorphic",
      contract: "ADR 0294 (decision 20: permissions); ADR 0208 (names); ADR 0099 (risk).",
    }),
    `import { Permission, Permissions } from "@stackra/iam";`,
    "",
    `/** The ${words} permissions. */`,
    `export class ${names.className}Permissions extends Permissions {`,
    ...permissionLines(names, verb, level),
    "}",
    "",
  ].join("\n");
}

/** The doc and static of one permission. */
function permissionLines(
  names: ReturnType<typeof modelNames>,
  verb: string,
  level: string,
): string[] {
  const doc =
    verb === "read"
      ? `Read the ${names.table.replaceAll("_", " ")}.`
      : `${verb.charAt(0).toUpperCase()}${verb.slice(1).replaceAll("_", " ")} ${/^[aeiou]/.test(names.snake) ? "an" : "a"} ${names.snake.replaceAll("_", " ")}.`;
  return [`  /** ${doc} */`, `  static readonly ${camelCase(verb)} = Permission.${level};`];
}

/**
 * Writes one piece of a feature into a service.
 *
 * @param options - the kind, the name and the flags.
 * @throws CliUsageError on a bad name or flag, a missing service, module or model, or a file that exists.
 * @example
 * scaffoldFeature({ kind: "action", name: "create-order", module: "orders", cwd: "/repo/services/shop" });
 */
export function scaffoldFeature(options: FeatureOptions): FeatureResult {
  const { kind, name } = options;
  if (!FEATURE_KINDS.includes(kind))
    throw new CliUsageError(`name the kind: ${FEATURE_KINDS.join(", ")}`);
  if (!KEBAB.test(name))
    throw new CliUsageError(
      `name it in kebab-case, such as ${kind === "action" ? "create-order" : kind === "query" ? "list-orders" : kind === "migration" ? "add-notes-to-orders" : kind === "module" ? "orders" : "order"}`,
    );
  for (const [flag, value] of [
    ["--module", options.module],
    ["--model", options.model],
  ] as const)
    if (value !== undefined && !KEBAB.test(value))
      throw new CliUsageError(`${flag} ${value} is not kebab-case`);
  const member = resolveMember(options.cwd, options.member);
  const manifestFile = join(member, "package.json");
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as Manifest;
  const modulesFolder = join(member, "src/modules");

  const moduleKey = kind === "module" ? name : options.module;
  if (moduleKey === undefined)
    throw new CliUsageError(`a ${kind} needs --module <key>, a folder under src/modules/`);
  const moduleFolder = join(modulesFolder, moduleKey);
  if (kind === "module" && existsSync(moduleFolder))
    throw new CliUsageError(`src/modules/${moduleKey} already exists`);
  if (kind !== "module" && !existsSync(moduleFolder))
    throw new CliUsageError(
      `src/modules/${moduleKey} does not exist; make it with \`stackra new module ${moduleKey}\``,
    );

  const files: TemplateFile[] = [];
  const edits = new Map<string, string>();
  const changed: string[] = [];
  const notes: string[] = [];
  const read = (path: string): string =>
    edits.get(path) ?? readFileSync(join(member, path), "utf8");

  if (kind === "module" || kind === "model") {
    const model = kind === "module" ? (options.model ?? singular(name)) : name;
    const names = modelNames(moduleKey, model);
    const modelKey = `${names.schema}.${names.snake}`;
    const taken = new Set<string>(
      Object.entries(PUBLIC_ID_PREFIXES)
        .filter(([, owner]) => owner !== modelKey)
        .map(([prefix]) => prefix),
    );
    for (const file of modelFilesUnder(join(member, "src")))
      for (const [, prefix = ""] of readFileSync(file, "utf8").matchAll(
        /HasPublicId\(\s*"([a-z]+)"\s*\)/g,
      ))
        taken.add(prefix);
    const owned = manifest.dependencies?.["@stackra/tenancy"] !== undefined;
    files.push(
      ...modelFiles({
        names,
        fields: parseFields(options.fields),
        prefix: derivePrefix(names.stem, taken, options.prefix),
        owner: options.global === true ? "global" : owned ? "tenant" : "plain",
        number: nextMigrationNumber(join(moduleFolder, "database/migrations")),
        permissions: !existsSync(join(moduleFolder, `access/${names.stem}.permissions.ts`)),
      }),
    );
    // A Permissions class the module already has gets the `read` its queries take.
    const permissionsPath = `src/modules/${moduleKey}/access/${names.stem}.permissions.ts`;
    if (
      existsSync(join(member, permissionsPath)) &&
      !/static\s+readonly\s+read\s*=/.test(read(permissionsPath))
    ) {
      edits.set(
        permissionsPath,
        appendMembers(read(permissionsPath), permissionLines(names, "read", "L0")),
      );
      changed.push(`${permissionsPath} (added read at L0)`);
    }
  } else {
    const models = modelsOf(moduleFolder);
    const words = name.split("-");
    // `--model` when given, else the longest tail of the name naming a model of the module, singular or plural
    // (`list-orders`, `add-notes-to-order-lines`); an action or query keeps at least one word for its verb.
    const named = (index: number): string | undefined => {
      const tail = words.slice(index).join("-");
      return [tail, singular(tail)].find((candidate) => models.includes(candidate));
    };
    const at =
      options.model === undefined
        ? words.findIndex(
            (_, index) => index >= (kind === "migration" ? 0 : 1) && named(index) !== undefined,
          )
        : words.findIndex(
            (_, index) =>
              index >= 1 &&
              [words.slice(index).join("-"), singular(words.slice(index).join("-"))].includes(
                options.model ?? "",
              ),
          );
    const model =
      options.model ??
      (at >= 0 ? named(at) : kind === "migration" && models.length === 1 ? models[0] : undefined);
    if (kind === "migration") {
      if (name.startsWith("create-"))
        throw new CliUsageError(
          `a table is created with its model: \`stackra new model <name> --module ${moduleKey}\` writes the model and its create migration`,
        );
      const fields = parseFields(options.fields);
      if (fields.length === 0)
        throw new CliUsageError(
          "a migration needs --fields <name>:<type>?, the nullable columns it adds; a drop, a rename or NOT NULL is written by hand (expand and contract)",
        );
      const required = fields.filter((field) => !field.nullable).map((field) => field.name);
      if (required.length > 0)
        throw new CliUsageError(
          `an added column is nullable, so rows written before it stay valid: write ${required.map((field) => `${field}:<type>?`).join(", ")}; make it NOT NULL in a later migration, after a backfill`,
        );
      if (options.table === undefined && (model === undefined || !models.includes(model)))
        throw new CliUsageError(
          `name the table: --model <a model of ${moduleKey}>, or --table <table> for a table no model of it maps to`,
        );
      const names = model === undefined ? undefined : modelNames(moduleKey, model);
      const table = options.table ?? names?.table ?? "";
      files.push(
        ...migrationFiles({
          module: moduleKey,
          schema: snakeCase(moduleKey),
          name,
          number: nextMigrationNumber(join(moduleFolder, "database/migrations")),
          table,
          fields,
        }),
      );
      // The model gets the fields its table now has, so the entity and the migrations agree.
      if (names !== undefined && options.table === undefined) {
        const path = `src/modules/${moduleKey}/models/${names.stem}.model.ts`;
        const known = readModel(read(path), path);
        const fresh = fields.filter(
          (field) => !known.fields.some((existing) => existing.name === field.name),
        );
        const decorated = fresh.filter((field) => field.decorators.length > 0);
        const plain = fresh.filter((field) => field.decorators.length === 0);
        let text = appendMembers(
          appendMembers(read(path), propertyLines(decorated), "start"),
          propertyLines(plain),
        );
        const decorators = decoratorNames(fresh);
        if (decorators.length > 0) text = ensureImport(text, decorators, "@stackra/validation");
        edits.set(path, text);
        changed.push(`${path} (added ${fresh.map((field) => field.name).join(", ")})`);
        notes.push(
          `add the new fields to ${names.className}View and the inputs that should carry them`,
        );
      }
    } else {
      if (model === undefined || !models.includes(model))
        throw new CliUsageError(
          `${model === undefined ? "name the model" : `${model} is not a model of ${moduleKey}`}: write the ${kind} as <verb>-<model> (such as ${kind === "action" ? "create" : "list"}-${models[0] ?? "order"}) or pass --model; \`stackra new model <name> --module ${moduleKey}\` makes one`,
        );
      const verbWords = at >= 0 ? words.slice(0, at) : words;
      const verb = snakeCase(verbWords.join("-"));
      const names = modelNames(moduleKey, model);
      const modelPath = `src/modules/${moduleKey}/models/${names.stem}.model.ts`;
      const facts = readModel(read(modelPath), modelPath);
      files.push(
        ...(kind === "action"
          ? actionFiles({ name, verb, names, model: facts })
          : queryFiles({ name, verb, names, model: facts })),
      );
      const permission = kind === "action" ? camelCase(verb) : "read";
      const level = kind === "action" ? "L2" : "L0";
      const permissionsPath = `src/modules/${moduleKey}/access/${names.stem}.permissions.ts`;
      if (!existsSync(join(member, permissionsPath)))
        files.push({ path: permissionsPath, content: permissionsFile(names, verb, level) });
      else {
        const text = read(permissionsPath);
        const existing = new RegExp(
          `static\\s+readonly\\s+${permission}\\s*=\\s*Permission\\.(L\\d)`,
        ).exec(text);
        if (existing === null) {
          edits.set(
            permissionsPath,
            appendMembers(text, permissionLines(names, kind === "action" ? verb : "read", level)),
          );
          changed.push(`${permissionsPath} (added ${permission} at ${level})`);
        } else if (kind === "action" && (existing[1] === "L0" || existing[1] === "L1"))
          notes.push(
            `${permissionsPath}: ${permission} is ${existing[1]}, but an action writes, so gen wants L2 or above`,
          );
      }
      if (kind === "action" && verb !== "create" && verb !== "update" && verb !== "delete")
        notes.push(
          `write what ${verb.replaceAll("_", " ")} does in src/modules/${moduleKey}/actions/${name}.action.ts (it loads the ${names.snake.replaceAll("_", " ")} and answers it)`,
        );
    }
  }

  const exists = files
    .filter((file) => existsSync(join(member, file.path)))
    .map((file) => file.path);
  if (exists.length > 0)
    throw new CliUsageError(`already there, nothing written: ${exists.join(", ")}`);

  // The packages the new files import, declared with the spec the service already uses for `@stackra/*`.
  const pieces = kind === "module" ? "model" : kind;
  const declared = { ...manifest.dependencies, ...manifest.devDependencies };
  const stackraSpec =
    Object.entries(declared).find(([dependency]) => dependency.startsWith("@stackra/"))?.[1] ??
    `^${cliVersion()}`;
  const added: string[] = [];
  const declare = (field: "dependencies" | "devDependencies", dependency: string): void => {
    if (declared[dependency] !== undefined) return;
    const spec = dependency.startsWith("@stackra/") ? stackraSpec : "catalog:";
    manifest[field] = Object.fromEntries(
      Object.entries({ ...manifest[field], [dependency]: spec }).toSorted(([left], [right]) =>
        left.localeCompare(right),
      ),
    );
    declared[dependency] = spec;
    added.push(dependency);
  };
  const tenancy = manifest.dependencies?.["@stackra/tenancy"] !== undefined;
  for (const dependency of [
    ...(RUNTIME[pieces] ?? []),
    ...(WIRING[pieces] ?? []),
    ...(tenancy && pieces !== "migration" ? TENANCY_WIRING : []),
  ])
    declare("dependencies", dependency);
  for (const dependency of TESTING[pieces] ?? []) declare("devDependencies", dependency);
  if (added.length > 0) changed.push(`package.json (declared ${added.join(", ")})`);

  if (options.dryRun !== true) {
    for (const file of files) {
      const target = join(member, file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
    for (const [path, text] of edits) writeFileSync(join(member, path), text);
    if (added.length > 0) writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
    if (options.format !== false) {
      const touched = [
        ...files.map((file) => file.path),
        ...edits.keys(),
        ...(added.length > 0 ? ["package.json"] : []),
      ].map((path) => join(member, path));
      const root = workspaceRoot(member);
      let oxfmt: string | undefined;
      for (let folder = member; oxfmt === undefined; folder = dirname(folder)) {
        const candidate = join(folder, "node_modules/.bin/oxfmt");
        if (existsSync(candidate)) oxfmt = candidate;
        else if (folder === root || dirname(folder) === folder) break;
      }
      try {
        if (oxfmt === undefined) throw new Error("no oxfmt");
        execFileSync(oxfmt, ["--write", ...touched], { cwd: root, stdio: "pipe" });
      } catch {
        notes.push("format the new files: `oxfmt --write src/modules` (no installed oxfmt ran)");
      }
    }
  }
  return {
    member,
    created: files.map((file) => file.path).toSorted(),
    changed,
    dependencies: added,
    notes,
  };
}
