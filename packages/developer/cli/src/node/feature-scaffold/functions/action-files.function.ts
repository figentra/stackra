/**
 * Stackra file contract:
 * Purpose: `actionFiles(options)`, the files of `stackra new action <verb>-<model>`: the action (key `<model>.<verb>`,
 *          users and agents, written idempotency), its input and output schemas and its unit test. `create` stores the
 *          model's fields, `update` changes the ones given, `delete` deletes by public id; any other verb loads the
 *          row by public id inside the action's transaction and answers it, the change itself written there by hand.
 * Boundary: pure; returns text and writes nothing. The permission the key derives is added to the model's Permissions
 *           class by the caller, at L2. The input mirrors the model's plain fields (`readModel`), so a field of
 *           another type is set by hand.
 * Runtime: node
 * Governing contract: ADR 0098 (actions are the unit); ADR 0294 (decisions 20 and 21: keys and the endpoint
 *                     convention); ADR 0305 (rule 11: schemas in `schemas/`); ADR 0136 (a client write declares
 *                     idempotency); ADR 0099 and STA-2096 (every write is at least L2); ADR 0022 (tests).
 */
import { pascalCase } from "@stackra/support";

import { contractHeader } from "#node/feature-scaffold/functions/contract-header.function";
import { decoratorNames } from "#node/feature-scaffold/functions/decorator-names.function";
import { propertyLines } from "#node/feature-scaffold/functions/property-lines.function";
import { sampleValue } from "#node/feature-scaffold/functions/sample-value.function";
import type { ModelFacts } from "#node/feature-scaffold/types/model-facts.type";
import type { ModelNames } from "#node/feature-scaffold/types/model-names.type";
import type { TemplateFile } from "#node/types/template-file.type";

/** The contract line of every action file. */
const CONTRACT = "ADR 0098; ADR 0294 (the v3 shape); ADR 0305 (one declaration per file).";

/**
 * The files of a new action.
 *
 * @param options - the action's kebab name, its verb, and the model's names and facts.
 * @example
 * actionFiles({ name: "create-order", verb: "create", names, model }).map((file) => file.path);
 */
export function actionFiles(options: {
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
  const kind: "create" | "update" | "delete" | "other" =
    verb === "create" || verb === "update" || verb === "delete" ? verb : "other";
  const view = (row: string): string[] => [
    `{ id: ${row}.id, ${fields.map((field) => `${field.name}: ${row}.${field.name}, `).join("")}createdAt: ${row}.createdAt }`,
  ];
  // The input schema.
  const inputDoc =
    kind === "create"
      ? `the ${words} to add: its fields`
      : kind === "update"
        ? `the ${words} to change by public id, and the fields to change (a field left out keeps its value)`
        : `the ${words} to ${verb.replaceAll("_", " ")}, by public id`;
  const inputLines =
    kind === "create"
      ? propertyLines(fields, (field) => field.nullable)
      : propertyLines(
          [
            {
              name: idField,
              column: names.snake,
              type: `PublicId<${JSON.stringify(prefix)}>`,
              nullable: false,
              decorators: [],
              doc: `The ${words}'s public id.`,
            },
            ...(kind === "update" ? fields : []),
          ],
          (field) => field.name !== idField,
        );
  // Each decorator from where the model imports it; `Schema` from validation; `PublicId` when the input has an id.
  const sources = new Map<string, Set<string>>([["@stackra/validation", new Set(["Schema"])]]);
  if (kind === "create" || kind === "update")
    for (const decorator of decoratorNames(fields)) {
      const source = model.imports.get(decorator) ?? "@stackra/validation";
      sources.set(source, new Set([...(sources.get(source) ?? []), decorator]));
    }
  const inputImports = [
    ...(kind === "create" ? [] : [`import type { PublicId } from "@stackra/contracts";`]),
    ...[...sources]
      .toSorted(([left], [right]) => left.localeCompare(right))
      .map(
        ([source, imported]) =>
          `import { ${[...imported].toSorted().join(", ")} } from ${JSON.stringify(source)};`,
      ),
  ];
  const inputFile = [
    contractHeader({
      purpose: `\`${input}\`, the input of \`${identity}\`: ${inputDoc}.`,
      boundary: `a shape class in its own file; the rules are the types and decorators, which gen compiles to the schema.`,
      runtime: "node",
      contract: CONTRACT,
    }),
    ...inputImports,
    "",
    `/** ${inputDoc.charAt(0).toUpperCase()}${inputDoc.slice(1)}. */`,
    inputLines.length > 0
      ? `export class ${input} extends Schema {`
      : `export class ${input} extends Schema {}`,
    ...(inputLines.length > 0 ? [...inputLines, "}"] : []),
    "",
  ].join("\n");

  // The output schema.
  const outputFile =
    kind === "delete"
      ? [
          contractHeader({
            purpose: `\`${output}\`, the output of \`${identity}\`: the public id and whether a row was deleted.`,
            boundary: `a shape class in its own file; built with \`${output}.create\`, never \`new\`.`,
            runtime: "node",
            contract: CONTRACT,
          }),
          `import type { PublicId } from "@stackra/contracts";`,
          `import { Schema } from "@stackra/validation";`,
          "",
          `/** The ${words} that was deleted. */`,
          `export class ${output} extends Schema {`,
          `  /** The ${words}'s public id. */`,
          `  id!: PublicId<${JSON.stringify(prefix)}>;`,
          "",
          "  /** False when no row had the id (already deleted, or never there). */",
          "  deleted!: boolean;",
          "}",
          "",
        ].join("\n")
      : [
          contractHeader({
            purpose: `\`${output}\`, the output of \`${identity}\`: the ${words} as stored.`,
            boundary: `a shape class in its own file; the ${words}'s view, built with \`${output}.create\`.`,
            runtime: "node",
            contract: CONTRACT,
          }),
          `import { ${className}View } from "#modules/${names.module}/schemas/${names.stem}-view.schema";`,
          "",
          `/** The ${words} as stored. */`,
          `export class ${output} extends ${className}View {}`,
          "",
        ].join("\n");

  // The action.
  const body =
    kind === "create"
      ? [
          `    const row = this.${names.plural}.create({`,
          ...fields.map(
            (field) =>
              `      ${field.name}: input.${field.name}${field.nullable ? " ?? null" : ""},`,
          ),
          "    });",
          `    return ${output}.create(${view("row").join("")});`,
        ]
      : kind === "update"
        ? [
            `    const row = await this.${names.plural}.update(`,
            `      { id: input.${idField} },`,
            fields.length === 0 ? "      {}," : "      {",
            ...fields.map(
              (field) =>
                `        ...(input.${field.name} === undefined ? {} : { ${field.name}: input.${field.name} }),`,
            ),
            ...(fields.length === 0 ? [] : ["      },"]),
            "    );",
            `    return ${output}.create(${view("row").join("")});`,
          ]
        : kind === "delete"
          ? [
              `    const deleted = await this.${names.plural}.delete({ id: input.${idField} });`,
              `    return ${output}.create({ id: input.${idField}, deleted: deleted > 0 });`,
            ]
          : [
              `    const row = await this.${names.plural}.findOneOrFail({ id: input.${idField} });`,
              `    // ${verb.replaceAll("_", " ")} the ${words} here, inside the action's transaction.`,
              `    return ${output}.create(${view("row").join("")});`,
            ];
  const summary =
    kind === "create"
      ? `add a ${words}. \`POST\` by the endpoint convention`
      : kind === "update"
        ? `change a ${words}'s fields. \`PATCH\` by the endpoint convention`
        : kind === "delete"
          ? `delete a ${words}. \`DELETE\` by the endpoint convention`
          : `${verb.replaceAll("_", " ")} a ${words}. \`PUT\` on the ${words} by the endpoint convention`;
  const action = [
    contractHeader({
      purpose: `\`${pascal}Action\`, \`${identity}\`: ${summary}, and an MCP tool (its actors include a user and an agent).`,
      boundary: `single aggregate, inline \`handle\`; its permission is \`${className}Permissions.${verb.replaceAll(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase())}\` (L2), derived from the key. \`${service}\` ${kind === "other" ? "loads the row" : "writes the row"} inside the action's transaction.`,
      runtime: "node",
      contract: `${CONTRACT} ADR 0136 (idempotency).`,
    }),
    `import { Action, type ActionContext, Idempotency } from "@stackra/actions";`,
    `import { ActorKind } from "@stackra/contracts";`,
    "",
    `import type { ${input} } from "#modules/${names.module}/schemas/${name}-input.schema";`,
    `import { ${output} } from "#modules/${names.module}/schemas/${name}-output.schema";`,
    `import type { ${service} } from "#modules/${names.module}/services/${names.stem}.service";`,
    "",
    `/** ${kind === "create" ? "Each call adds a row; a client retry with the same idempotency key answers the first result." : "A client retry with the same idempotency key answers the first result."} */`,
    `export class ${pascal}Action extends Action({`,
    `  key: ${JSON.stringify(key)},`,
    "  actors: [ActorKind.User, ActorKind.Agent],",
    "  idempotency: Idempotency.Optional,",
    "}) {",
    "  /**",
    `   * @param ${names.plural} - ${kind === "other" ? "reads" : "writes"} the rows.`,
    "   */",
    `  constructor(private readonly ${names.plural}: ${service}) {`,
    "    super();",
    "  }",
    "",
    `  /** ${kind === "create" ? `Stores the ${words} and answers it as stored.` : kind === "update" ? `Changes the fields given and answers the ${words} as stored.` : kind === "delete" ? "Deletes the row and says whether there was one." : `Loads the ${words} and answers it.`} */`,
    `  async handle(input: ${input}, _ctx: ActionContext): Promise<${output}> {`,
    ...body,
    "  }",
    "}",
    "",
  ].join("\n");

  // The test.
  const id = `${prefix}_01ja0000000000000000000001`;
  const sample = fields.map((field) => `${field.name}: ${sampleValue(field)}`);
  const stored = `Object.assign(new ${className}(), { id: ${names.camel}Id, createdAt${sample.map((entry) => `, ${entry}`).join("")} })`;
  const expected = `{ id: ${names.camel}Id${sample.map((entry) => `, ${entry}`).join("")}, createdAt }`;
  const behaviour =
    kind === "create"
      ? {
          title: "stores the fields and answers the row as stored",
          stub: [
            "    const created: object[] = [];",
            `    const ${names.plural} = {`,
            "      create: (data: object) => {",
            "        created.push(data);",
            `        return Object.assign(new ${className}(), { id: ${names.camel}Id, createdAt }, data);`,
            "      },",
            `    } as unknown as ${service};`,
          ],
          call: `${input}.create({${sample.length > 0 ? ` ${sample.join(", ")} ` : ""}})`,
          checks: [
            `    expect(created).toEqual([{${sample.length > 0 ? ` ${sample.join(", ")} ` : ""}}]);`,
            `    expect({ ...output }).toEqual(${expected});`,
          ],
        }
      : kind === "update"
        ? {
            title: "changes the row by its public id and answers it as stored",
            stub: [
              "    const changes: object[] = [];",
              `    const ${names.plural} = {`,
              "      update: async (where: object, data: object) => {",
              "        changes.push({ where, data });",
              `        return Object.assign(${stored}, data);`,
              "      },",
              `    } as unknown as ${service};`,
            ],
            call: `${input}.create({ ${idField}: ${names.camel}Id })`,
            checks: [
              `    expect(changes).toEqual([{ where: { id: ${names.camel}Id }, data: {} }]);`,
              `    expect({ ...output }).toEqual(${expected});`,
            ],
          }
        : kind === "delete"
          ? {
              title: "deletes the row by its public id and says it did",
              stub: [
                "    const deletes: object[] = [];",
                `    const ${names.plural} = {`,
                "      delete: async (where: object) => {",
                "        deletes.push(where);",
                "        return 1;",
                "      },",
                `    } as unknown as ${service};`,
              ],
              call: `${input}.create({ ${idField}: ${names.camel}Id })`,
              checks: [
                `    expect(deletes).toEqual([{ id: ${names.camel}Id }]);`,
                `    expect({ ...output }).toEqual({ id: ${names.camel}Id, deleted: true });`,
              ],
            }
          : {
              title: "loads the row by its public id and answers it",
              stub: [
                `    const ${names.plural} = {`,
                "      findOneOrFail: async (where: { id: string }) =>",
                `        where.id === ${names.camel}Id ? ${stored} : Promise.reject(new Error("not found")),`,
                `    } as unknown as ${service};`,
              ],
              call: `${input}.create({ ${idField}: ${names.camel}Id })`,
              checks: [`    expect({ ...output }).toEqual(${expected});`],
            };
  const test = [
    contractHeader({
      purpose: `unit tests of \`${pascal}Action\`: the \`${key}\` action for users and agents, which ${behaviour.title}.`,
      boundary: `test only; the action is called directly with a stand-in ${words} service and a fake action context. The pipeline's permission, idempotency and transaction are the pipeline's own tests.`,
      runtime: "node (vitest)",
      contract: "ADR 0022 (test placement); ADR 0098; ADR 0294 (the v3 shape).",
    }),
    `import { fakeActionContext } from "@stackra/actions/testing";`,
    `import { kindOf } from "@stackra/container";`,
    `import { ActorKind, type PublicId } from "@stackra/contracts";`,
    `import { describe, expect, it } from "@stackra/testing";`,
    "",
    `import { ${pascal}Action } from "#modules/${names.module}/actions/${name}.action";`,
    ...(kind === "delete"
      ? []
      : [`import { ${className} } from "#modules/${names.module}/models/${names.stem}.model";`]),
    `import { ${input} } from "#modules/${names.module}/schemas/${name}-input.schema";`,
    `import type { ${service} } from "#modules/${names.module}/services/${names.stem}.service";`,
    "",
    `const ${names.camel}Id = ${JSON.stringify(id)} as PublicId<${JSON.stringify(prefix)}>;`,
    ...(kind === "delete" ? [] : [`const createdAt = new Date("2026-01-01T00:00:00.000Z");`]),
    "",
    `/** The ${key} action. */`,
    `describe(${pascal}Action, () => {`,
    "  /** Its key and actors are what gen derives the route, permission and tool from. */",
    `  it(${JSON.stringify(`is the ${key} action for users and agents`)}, () => {`,
    `    expect(kindOf(${pascal}Action)?.options).toMatchObject({`,
    `      key: ${JSON.stringify(key)},`,
    "      actors: [ActorKind.User, ActorKind.Agent],",
    "    });",
    "  });",
    "",
    `  it(${JSON.stringify(behaviour.title)}, async () => {`,
    ...behaviour.stub,
    "",
    `    const output = await new ${pascal}Action(${names.plural}).handle(`,
    `      ${behaviour.call},`,
    "      fakeActionContext(),",
    "    );",
    "",
    ...behaviour.checks,
    "  });",
    "});",
    "",
  ].join("\n");

  return [
    { path: `${folder}/actions/${name}.action.ts`, content: action },
    { path: `${folder}/schemas/${name}-input.schema.ts`, content: inputFile },
    { path: `${folder}/schemas/${name}-output.schema.ts`, content: outputFile },
    { path: `${folder}/actions/__tests__/${name}.action.test.ts`, content: test },
  ];
}
