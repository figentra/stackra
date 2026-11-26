/**
 * Stackra file contract:
 * Purpose: `modelFiles(options)`, the files of `stackra new model` (and of the first model of `stackra new module`):
 *          the model with its public id, timestamps and `--fields`; its create migration in the module's next number
 *          with a unit test that runs it on PGlite; its `CrudService`; its view schema; and its Permissions class with
 *          the L0 `read` the queries take.
 * Boundary: pure; returns text and writes nothing. The owner is decided by the caller: tenant-owned
 *           (`BelongsToTenant`, `t.belongsToTenant()`) in a member that runs `@stackra/tenancy`, `Model.global` when
 *           asked, plain otherwise. Every column states its nullability and a comment. A file the module already has
 *           (its Permissions class) is left to the caller to skip.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13 and 20); ADR 0305 (partners, one declaration per file); ADR 0159 (as
 *                     amended: frozen snapshots, nullability and comments); ADR 0239 (decision 1: owned or global);
 *                     ADR 0099 (permission risk); ADR 0182 (test tiers); ADR 0266 (the memory driver).
 */
import { pascalCase } from "@stackra/support";

import { contractHeader } from "#node/feature-scaffold/functions/contract-header.function";
import { decoratorNames } from "#node/feature-scaffold/functions/decorator-names.function";
import { propertyLines } from "#node/feature-scaffold/functions/property-lines.function";
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";
import type { ModelNames } from "#node/feature-scaffold/types/model-names.type";
import type { TemplateFile } from "#node/types/template-file.type";

/** The contract line of the model's files. */
const SHAPE = "ADR 0294 (the v3 shape); ADR 0305 (partners, one declaration per file)";

/**
 * The files of a new model.
 *
 * @param options - the model's names, fields, prefix and owner, the migration number and the files to leave out.
 * @example
 * modelFiles({ names, fields: [], prefix: "ord", owner: "plain", number: "0001" }).map((file) => file.path);
 */
export function modelFiles(options: {
  readonly names: ModelNames;
  readonly fields: readonly FeatureField[];
  readonly prefix: string;
  readonly owner: "tenant" | "global" | "plain";
  readonly number: string;
  readonly permissions: boolean;
}): readonly TemplateFile[] {
  const { names, fields, prefix, owner, number } = options;
  const { className, stem, table, schema } = names;
  const folder = `src/modules/${names.module}`;
  const migrationStem = `${number}-create-${table.replaceAll("_", "-")}`;
  const migrationClass = `Create${pascalCase(table)}Migration`;
  const traits = [
    ...(owner === "tenant" ? ["BelongsToTenant"] : []),
    `HasPublicId(${JSON.stringify(prefix)})`,
    "Timestamps",
  ].join(", ");
  const decorators = decoratorNames(fields);
  const ownerWords =
    owner === "tenant"
      ? "tenant-owned: `BelongsToTenant` gives the table its `tenant_id` and row-level security"
      : owner === "global"
        ? "global by design (`Model.global`): one table for every tenant, no row-level security"
        : "a plain model in a member that does not run `@stackra/tenancy`";
  const model = [
    contractHeader({
      purpose: `\`${className}\`, a model of the ${names.module} module. Key \`${schema}.${names.snake}\`, table \`${schema}.${table}\`, public ids \`${prefix}_…\`.`,
      boundary: `data only; ${ownerWords}. Its table is created by \`${migrationStem}\`.`,
      runtime: "node",
      contract: `${SHAPE}; ADR 0239 (decision 1: owned or global).`,
    }),
    `import { HasPublicId, Model, Timestamps } from "@stackra/model";`,
    ...(owner === "tenant" ? [`import { BelongsToTenant } from "@stackra/tenancy/node";`] : []),
    ...(decorators.length > 0
      ? [`import { ${decorators.join(", ")} } from "@stackra/validation";`]
      : []),
    "",
    `/** One row of \`${schema}.${table}\`. */`,
    fields.length === 0
      ? `export class ${className} extends Model.${owner === "global" ? "global" : "with"}(${traits}) {}`
      : `export class ${className} extends Model.${owner === "global" ? "global" : "with"}(${traits}) {`,
    ...(fields.length === 0 ? [] : [...propertyLines(fields), "}"]),
    "",
  ].join("\n");

  const migration = [
    contractHeader({
      purpose: `the migration that creates \`${table}\`, the table of \`${className}\`, in the module's \`${schema}\` schema.`,
      boundary:
        "a frozen snapshot once applied: it imports only `@stackra/database` and every name is a literal. No `down()`: gen derives the dev inverse.",
      runtime: "node",
      contract: `ADR 0159 (as amended); ADR 0294 (the v3 shape)${owner === "tenant" ? "; ADR 0239 (the tenant column and policy)" : ""}.`,
    }),
    `import { type Blueprint, Migration, type SchemaBuilder } from "@stackra/database";`,
    "",
    `/** Creates the ${table} table. */`,
    `export class ${migrationClass} extends Migration {`,
    `  /** Creates the table with its public id${owner === "tenant" ? ", tenant" : ""}, timestamps${fields.length > 0 ? " and fields" : ""}. */`,
    "  up(schema: SchemaBuilder): void {",
    `    schema.create(${JSON.stringify(table)}, (t: Blueprint) => {`,
    `      t.hasPublicId(${JSON.stringify(prefix)});`,
    ...(owner === "tenant" ? ["      t.belongsToTenant();"] : []),
    "      t.timestamps();",
    ...fields.map(
      (field) =>
        `      ${field.blueprint}.${field.nullable ? "nullable" : "notNull"}().comment(${JSON.stringify(field.doc)});`,
    ),
    "    });",
    "  }",
    "}",
    "",
  ].join("\n");

  const migrationTest = [
    contractHeader({
      purpose: `runs \`${migrationStem}\` on PGlite: the memory driver applies the compiled migrations \`stackra gen\` writes into \`.stackra/migrations\`, and the \`${schema}.${table}\` table starts empty.`,
      boundary: "unit tier: PGlite runs in this process, no Docker.",
      runtime: "node (vitest)",
      contract: "ADR 0022 (test placement); ADR 0266 (memory first); ADR 0159.",
    }),
    `import { MemoryDatabaseDriver } from "@stackra/database/testing";`,
    `import { describe, expect, it } from "@stackra/testing";`,
    "",
    `describe(${JSON.stringify(`${migrationStem} migration`)}, { timeout: 60_000 }, () => {`,
    `  it(${JSON.stringify(`creates an empty ${table} table`)}, async () => {`,
    "    const database = new MemoryDatabaseDriver();",
    "    // raw-sql: the test checks the migration's table, which is DDL",
    "    const rows = await database",
    "      .em()",
    `      .execute<{ count: number }[]>(${JSON.stringify(`select count(*)::int as count from ${schema}.${table}`)});`,
    "    expect(rows).toEqual([{ count: 0 }]);",
    "    await database.close();",
    "  });",
    "});",
    "",
  ].join("\n");

  const service = [
    contractHeader({
      purpose: `\`${className}Service\`, the reads and writes of \`${className}\` rows for the module's actions and queries.`,
      boundary:
        "runs inside the caller's transaction; `CrudService` supplies the standard reads and writes, and a method added here is one more of them.",
      runtime: "node",
      contract: "ADR 0294 (the v3 shape); ADR 0305 (partners).",
    }),
    `import { CrudService } from "@stackra/database";`,
    "",
    `import type { ${className} } from "#modules/${names.module}/models/${stem}.model";`,
    "",
    `/** The ${names.snake.replaceAll("_", " ")} aggregate's service. */`,
    `export class ${className}Service extends CrudService<${className}> {}`,
    "",
  ].join("\n");

  const view = [
    contractHeader({
      purpose: `\`${className}View\`, one ${names.snake.replaceAll("_", " ")} as a caller sees it: its public id${fields.length > 0 ? ", its fields" : ""} and its creation time.`,
      boundary:
        "a shape class in its own file; never the model, so no database column leaves the module unasked.",
      runtime: "node",
      contract: `${SHAPE}.`,
    }),
    `import type { PublicId } from "@stackra/contracts";`,
    `import { ${["Schema", ...decorators].toSorted().join(", ")} } from "@stackra/validation";`,
    "",
    `/** One ${names.snake.replaceAll("_", " ")} as the list and the console show it. */`,
    `export class ${className}View extends Schema {`,
    ...propertyLines([
      {
        name: "id",
        column: "id",
        type: `PublicId<${JSON.stringify(prefix)}>`,
        nullable: false,
        decorators: [],
        doc: `The ${names.snake.replaceAll("_", " ")}'s public id.`,
      },
      ...fields,
      {
        name: "createdAt",
        column: "created_at",
        type: "Date",
        nullable: false,
        decorators: [],
        doc: `When the ${names.snake.replaceAll("_", " ")} was created.`,
      },
    ]),
    "}",
    "",
  ].join("\n");

  const permissions = [
    contractHeader({
      purpose: `\`${className}Permissions\`, the permissions of the ${names.snake.replaceAll("_", " ")} model: \`${schema}.${names.snake}.<verb>\`, each with its risk.`,
      boundary:
        "statics only; the value is the risk. The key is derived from the module, the class (minus `Permissions`) and the static. A query reads `read`; each action adds its own verb at L2 or above.",
      runtime: "isomorphic",
      contract: "ADR 0294 (decision 20: permissions); ADR 0208 (names); ADR 0099 (risk).",
    }),
    `import { Permission, Permissions } from "@stackra/iam";`,
    "",
    `/** Read by the ${names.snake.replaceAll("_", " ")} queries; each action adds its verb. */`,
    `export class ${className}Permissions extends Permissions {`,
    `  /** Read the ${names.table.replaceAll("_", " ")}. */`,
    "  static readonly read = Permission.L0;",
    "}",
    "",
  ].join("\n");

  return [
    { path: `${folder}/models/${stem}.model.ts`, content: model },
    { path: `${folder}/database/migrations/${migrationStem}.migration.ts`, content: migration },
    {
      path: `${folder}/database/migrations/__tests__/${migrationStem}.migration.test.ts`,
      content: migrationTest,
    },
    { path: `${folder}/services/${stem}.service.ts`, content: service },
    { path: `${folder}/schemas/${stem}-view.schema.ts`, content: view },
    ...(options.permissions
      ? [{ path: `${folder}/access/${stem}.permissions.ts`, content: permissions }]
      : []),
  ];
}
