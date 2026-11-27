/**
 * Stackra file contract:
 * Purpose: `queryFiles(options)`, the files of `stackra new query <verb>-<model>`: the query (key `<model>.<verb>`,
 *          users and agents), its input and output schemas and its unit test. `get` answers one row by public id;
 *          `list` and any other verb (`search`, `feed`) answer one cursor page, newest first.
 * Boundary: pure; returns text and writes nothing. The query reads the model's L0 `read` permission (gen's default
 *           for a query whose verb the Permissions class does not declare), which the model scaffold writes. The cursor
 *           is the last row's public id: ids are minted over UUIDv7, so their order is the creation order.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 20 and 21); ADR 0155 (queries are MCP tools); ADR 0305 (rule 11); the
 *                     HTTP conventions (cursor pagination; a query reads at L0 or L1); ADR 0022 (tests).
 */
import { pascalCase } from "@stackra/support";

import { contractHeader } from "#node/feature-scaffold/functions/contract-header.function";
import { sampleValue } from "#node/feature-scaffold/functions/sample-value.function";
import type { ModelFacts } from "#node/feature-scaffold/types/model-facts.type";
import type { ModelNames } from "#node/feature-scaffold/types/model-names.type";
import type { TemplateFile } from "#node/types/template-file.type";

/** The contract line of every query file. */
const CONTRACT = "ADR 0294 (the v3 shape); ADR 0155; ADR 0305 (one declaration per file).";

/**
 * The files of a new query.
 *
 * @param options - the query's kebab name, its verb, and the model's names and facts.
 * @example
 * queryFiles({ name: "list-orders", verb: "list", names, model }).map((file) => file.path);
 */
export function queryFiles(options: {
  readonly name: string;
  readonly verb: string;
  readonly names: ModelNames;
  readonly model: ModelFacts;
}): readonly TemplateFile[] {
  const { name, verb, names, model } = options;
  const { className, fields, prefix } = model;
  const pascal = pascalCase(name);
  const key = `${names.snake}.${verb}`;
  const identity = `${names.schema}.${key}@1`;
  const folder = `src/modules/${names.module}`;
  const words = names.snake.replaceAll("_", " ");
  const idField = `${names.camel}Id`;
  const service = `${className}Service`;
  const input = `${pascal}Input`;
  const output = `${pascal}Output`;
  const view = `${className}View`;
  const one = verb === "get";
  const mapping = (row: string): string =>
    `{ id: ${row}.id, ${fields.map((field) => `${field.name}: ${row}.${field.name}, `).join("")}createdAt: ${row}.createdAt }`;

  const inputFile = one
    ? [
        contractHeader({
          purpose: `\`${input}\`, the input of \`${identity}\`: the public id of the ${words} to read.`,
          boundary: "a shape class in its own file.",
          runtime: "node",
          contract: CONTRACT,
        }),
        `import type { PublicId } from "@stackra/contracts";`,
        `import { Schema } from "@stackra/validation";`,
        "",
        `/** The ${words} to read. */`,
        `export class ${input} extends Schema {`,
        `  /** The ${words}'s public id. */`,
        `  ${idField}!: PublicId<${JSON.stringify(prefix)}>;`,
        "}",
        "",
      ].join("\n")
    : [
        contractHeader({
          purpose: `\`${input}\`, the input of \`${identity}\`: the cursor of the page to read and its size.`,
          boundary:
            "a shape class in its own file; `CursorInput` gives `cursor` and `limit` (1 to 100, 20 by default). A filter is a field added here.",
          runtime: "node",
          contract: `${CONTRACT} The HTTP conventions (cursor pagination).`,
        }),
        `import { CursorInput } from "@stackra/validation";`,
        "",
        `/** Which page of ${names.table.replaceAll("_", " ")} to read. */`,
        `export class ${input} extends CursorInput {}`,
        "",
      ].join("\n");

  const outputFile = one
    ? [
        contractHeader({
          purpose: `\`${output}\`, the output of \`${identity}\`: the ${words}.`,
          boundary: `a shape class in its own file; the ${words}'s view.`,
          runtime: "node",
          contract: CONTRACT,
        }),
        `import { ${view} } from "#modules/${names.module}/schemas/${names.stem}-view.schema";`,
        "",
        `/** The ${words}. */`,
        `export class ${output} extends ${view} {}`,
        "",
      ].join("\n")
    : [
        contractHeader({
          purpose: `\`${output}\`, the output of \`${identity}\`: one page of ${names.table.replaceAll("_", " ")}, newest first.`,
          boundary:
            "a shape class in its own file; `Page.of` gives `items`, `nextCursor` (absent on the last page) and `hasMore`.",
          runtime: "node",
          contract: `${CONTRACT} The HTTP conventions (cursor pagination).`,
        }),
        `import { Page } from "@stackra/validation";`,
        "",
        `import { ${view} } from "#modules/${names.module}/schemas/${names.stem}-view.schema";`,
        "",
        `/** A page of ${names.table.replaceAll("_", " ")}. */`,
        `export class ${output} extends Page.of(${view}) {}`,
        "",
      ].join("\n");

  const body = one
    ? [
        `    const row = await this.${names.plural}.findOneOrFail({ id: input.${idField} });`,
        `    return ${output}.create(${mapping("row")});`,
      ]
    : [
        `    const after = input.cursor as PublicId<${JSON.stringify(prefix)}> | undefined;`,
        `    const rows = await this.${names.plural}.find(after === undefined ? {} : { id: { $lt: after } }, {`,
        "      orderBy: { id: SortDirection.Desc },",
        "      limit: input.limit + 1,",
        "    });",
        "    const items = rows.slice(0, input.limit);",
        "    const last = items.at(-1);",
        "    const hasMore = rows.length > input.limit && last !== undefined;",
        `    return ${output}.create({`,
        `      items: items.map((row) => ${view}.create(${mapping("row")})),`,
        "      hasMore,",
        "      ...(hasMore ? { nextCursor: last.id } : {}),",
        "    });",
      ];
  const query = [
    contractHeader({
      purpose: `\`${pascal}Query\`, \`${identity}\`: ${one ? `one ${words} by public id. \`GET\` on the ${words}` : `the ${names.table.replaceAll("_", " ")}, newest first, one cursor page at a time. \`GET\``} by the endpoint convention, and an MCP tool (queries are by default).`,
      boundary: `read only, uncached; its permission is \`${className}Permissions.read\` (L0), derived from the key.${one ? " An unknown id is a not-found refusal." : " The cursor is the last row's public id: ids are minted over UUIDv7, so their order is the creation order."}`,
      runtime: "node",
      contract: `${CONTRACT}${one ? "" : " The HTTP conventions (cursor pagination)."}`,
    }),
    `import { Query, type QueryContext } from "@stackra/actions";`,
    `import { ActorKind${one ? "" : ", type PublicId, SortDirection"} } from "@stackra/contracts";`,
    "",
    `import type { ${input} } from "#modules/${names.module}/schemas/${name}-input.schema";`,
    `import { ${output} } from "#modules/${names.module}/schemas/${name}-output.schema";`,
    ...(one
      ? []
      : [`import { ${view} } from "#modules/${names.module}/schemas/${names.stem}-view.schema";`]),
    `import type { ${service} } from "#modules/${names.module}/services/${names.stem}.service";`,
    "",
    `/** ${one ? `Reads one ${words}.` : "Reads one row more than the page, to know whether another page follows."} */`,
    `export class ${pascal}Query extends Query({`,
    `  key: ${JSON.stringify(key)},`,
    "  actors: [ActorKind.User, ActorKind.Agent],",
    "}) {",
    "  /**",
    `   * @param ${names.plural} - reads the rows.`,
    "   */",
    `  constructor(private readonly ${names.plural}: ${service}) {`,
    "    super();",
    "  }",
    "",
    `  /** ${one ? `The ${words} with \`input.${idField}\`.` : "The page after `input.cursor` (the first page without one)."} */`,
    `  async handle(input: ${input}, _ctx: QueryContext): Promise<${output}> {`,
    ...body,
    "  }",
    "}",
    "",
  ].join("\n");

  const sample = fields.map((field) => `${field.name}: ${sampleValue(field)}`);
  const row = (n: string, at: string): string =>
    `Object.assign(new ${className}(), { id: ${n}, createdAt: ${at}${sample.map((entry) => `, ${entry}`).join("")} })`;
  const test = one
    ? [
        "",
        `const ${names.camel}Id = ${JSON.stringify(`${prefix}_01ja0000000000000000000001`)} as PublicId<${JSON.stringify(prefix)}>;`,
        `const createdAt = new Date("2026-01-01T00:00:00.000Z");`,
        "",
        `/** A ${words} service holding one row. */`,
        `const ${names.plural} = {`,
        "  findOneOrFail: async (where: { id: string }) =>",
        `    where.id === ${names.camel}Id ? ${row(`${names.camel}Id`, "createdAt")} : Promise.reject(new Error("not found")),`,
        `} as unknown as ${service};`,
        "",
        `/** The ${key} query. */`,
        `describe(${pascal}Query, () => {`,
        "  /** Its key and actors are what gen derives the route, permission and tool from. */",
        `  it(${JSON.stringify(`is the ${key} query for users and agents`)}, () => {`,
        `    expect(kindOf(${pascal}Query)?.options).toMatchObject({`,
        `      key: ${JSON.stringify(key)},`,
        "      actors: [ActorKind.User, ActorKind.Agent],",
        "    });",
        "  });",
        "",
        `  it("answers the row with the public id", async () => {`,
        `    const output = await new ${pascal}Query(${names.plural}).handle(`,
        `      ${input}.create({ ${idField}: ${names.camel}Id }),`,
        "      fakeActionContext() as never,",
        "    );",
        `    expect({ ...output }).toEqual({ id: ${names.camel}Id${sample.map((entry) => `, ${entry}`).join("")}, createdAt });`,
        "  });",
        "});",
        "",
      ]
    : [
        "",
        "/** Three stored rows, oldest first, as the ids sort. */",
        "const stored = [1, 2, 3].map((n) =>",
        `  ${row(`\`${prefix}_01ja000000000000000000000\${n}\` as PublicId<${JSON.stringify(prefix)}>`, "new Date(`2026-01-0${n}T00:00:00.000Z`)")},`,
        ");",
        "",
        `/** A ${words} service whose \`find\` honours the \`$lt\` filter, the descending id order and the limit. */`,
        `const ${names.plural} = {`,
        "  find: async (where: { id?: { $lt: string } }, options: { limit: number }) =>",
        "    stored",
        "      .filter((row) => where.id === undefined || row.id < where.id.$lt)",
        "      .toReversed()",
        "      .slice(0, options.limit),",
        `} as unknown as ${service};`,
        "",
        `/** The ${key} query. */`,
        `describe(${pascal}Query, () => {`,
        "  /** Its key and actors are what gen derives the route, permission and tool from. */",
        `  it(${JSON.stringify(`is the ${key} query for users and agents`)}, () => {`,
        `    expect(kindOf(${pascal}Query)?.options).toMatchObject({`,
        `      key: ${JSON.stringify(key)},`,
        "      actors: [ActorKind.User, ActorKind.Agent],",
        "    });",
        "  });",
        "",
        "  /** Two pages of two: the first has a cursor, the second is the last. */",
        `  it("pages newest first and continues after the cursor", async () => {`,
        `    const query = new ${pascal}Query(${names.plural});`,
        "    const context = fakeActionContext() as never;",
        "",
        `    const first = await query.handle(${input}.create({ limit: 2 }), context);`,
        "    expect(first.items.map((item) => item.id)).toEqual([stored[2]?.id, stored[1]?.id]);",
        "    expect(first.hasMore).toBe(true);",
        "    expect(first.nextCursor).toBe(stored[1]?.id);",
        "",
        `    const cursor = first.nextCursor ?? "";`,
        `    const second = await query.handle(${input}.create({ limit: 2, cursor }), context);`,
        "    expect(second.items.map((item) => item.id)).toEqual([stored[0]?.id]);",
        "    expect(second.hasMore).toBe(false);",
        "    expect(second.nextCursor).toBeUndefined();",
        "  });",
        "});",
        "",
      ];
  const testFile = [
    contractHeader({
      purpose: `unit tests of \`${pascal}Query\`: the \`${key}\` query for users and agents, which ${one ? "answers one row by public id" : "reads one row more than the page to know whether another follows, answers newest first, and reads the next page after the cursor it handed out"}.`,
      boundary: `test only; the query is called directly with a stand-in ${words} service and a fake context.`,
      runtime: "node (vitest)",
      contract: "ADR 0022 (test placement); ADR 0294 (the v3 shape); the HTTP conventions.",
    }),
    `import { fakeActionContext } from "@stackra/actions/testing";`,
    `import { kindOf } from "@stackra/container";`,
    `import { ActorKind, type PublicId } from "@stackra/contracts";`,
    `import { describe, expect, it } from "@stackra/testing";`,
    "",
    `import { ${className} } from "#modules/${names.module}/models/${names.stem}.model";`,
    `import { ${pascal}Query } from "#modules/${names.module}/queries/${name}.query";`,
    `import { ${input} } from "#modules/${names.module}/schemas/${name}-input.schema";`,
    `import type { ${service} } from "#modules/${names.module}/services/${names.stem}.service";`,
    ...test,
  ].join("\n");

  return [
    { path: `${folder}/queries/${name}.query.ts`, content: query },
    { path: `${folder}/schemas/${name}-input.schema.ts`, content: inputFile },
    { path: `${folder}/schemas/${name}-output.schema.ts`, content: outputFile },
    { path: `${folder}/queries/__tests__/${name}.query.test.ts`, content: testFile },
  ];
}
