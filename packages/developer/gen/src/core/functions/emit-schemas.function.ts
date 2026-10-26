/**
 * Stackra file contract:
 * Purpose: `emitSchemas`, the shape compiler's output for one module: `.stackra/gen/schemas/<module>.ts`, reached as
 *          `#stackra/schemas/<module>`, with one `X$` per enum and shape, a type `X$Check` per shape that makes the type
 *          checker prove the schema's output equals the class's fields, an `X$` alias per config class naming its
 *          schema, one `registerSchemas` call linking each class to its `X$` (gap G1), and beside it one
 *          `registerChanges` call linking each `Change<Subject>` class to its subject (ADR 0118, 0141 notes).
 * Boundary: pure. Names are qualified by the file (one file per module), so a class name used in two modules never
 *           collides. `?:` compiles to `.exactOptional()`, `Date` to the ISO 8601 codec, `Money` to its codec, an enum
 *           to its codes in source order; a member base is `.extend`ed and a package base's shipped `X$` gets only new
 *           defaults. A reference to a shape declared later in the file is `z.lazy`, so a cycle still loads. A
 *           `Translated` field is a locale map decoded through `Translated.of` (`TranslatedStrings` to `{ values }`),
 *           its `@Str` rules on each text; an `Upload<Bucket>` field is `@stackra/media`'s `Upload.schema`. A bare
 *           `PublicId` checks the format with any prefix; a prefix union is a union of `publicId(prefix)`. A `@stackra/*` type with a shipped `X$` imports that schema
 *           (as `ShippedX$`) instead of compiling the shape again (STA-1290).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: the shape compiler); ADR 0305 (rules 1 and 14); registry v3.1 gap G1;
 *                     ADR 0162 (decision 2); ADR 0222 (decision 2).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import { importLines } from "#core/functions/import-lines.function";
import type { ClassValue } from "#core/types/class-value.type";
import type { FieldIR } from "#core/types/field-ir.type";
import type { FieldRule } from "#core/types/field-rule.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RegexValue } from "#core/types/regex-value.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** The import map of the file under construction. */
type Imports = Map<string, Map<string, boolean>>;

/** Records `name` from `from`; a value use wins over a type-only use. */
function use(imports: Imports, from: string, name: string, typeOnly = false): void {
  const names = imports.get(from) ?? new Map<string, boolean>();
  names.set(name, typeOnly && (names.get(name) ?? true));
  imports.set(from, names);
}

/** A rule option as a TypeScript literal. */
function literal(value: unknown): string {
  if (typeof value === "object" && value !== null && "$regex" in value) {
    const regex = value as RegexValue;
    return `/${regex.$regex}/${regex.flags}`;
  }
  return JSON.stringify(value);
}

/** The method calls that apply the options of `rules` named `name`, in `map` order. */
function calls(
  rules: readonly FieldRule[],
  name: string,
  map: Readonly<Record<string, string>>,
): string {
  const options = rules.find((rule) => rule.name === name)?.options ?? {};
  return Object.entries(map)
    .filter(([key]) => options[key] !== undefined)
    .map(([key, method]) => `.${method}(${literal(options[key])})`)
    .join("");
}

/** The state shared by the expression builders of one file. */
interface Context {
  readonly module: string;
  readonly imports: Imports;
  readonly declared: Set<string>;
}

/** A reference to the `X$` of a shape or enum: local, lazy when not yet declared, or imported from its module file. */
function reference(context: Context, module: string, name: string): string {
  if (module !== context.module) {
    use(context.imports, `./${module}`, `${name}$`);
    return `${name}$`;
  }
  return context.declared.has(name) ? `${name}$` : `z.lazy(() => ${name}$)`;
}

/** The zod expression of one type. */
function zodOf(
  context: Context,
  type: TypeDesc,
  rules: readonly FieldRule[],
  each: readonly FieldRule[],
): string {
  const { imports } = context;
  switch (type.kind) {
    case "string": {
      const trim = rules.some((rule) => rule.name === "Trim") ? ".trim()" : "";
      return `z.string()${trim}${calls(rules, "Str", { min: "min", max: "max", pattern: "regex" })}`;
    }
    case "number":
      return rules.some((rule) => rule.name === "Int")
        ? `z.number().int()${calls(rules, "Int", { min: "min", max: "max" })}`
        : `z.number()${calls(rules, "Num", { min: "min", max: "max", exclusiveMin: "gt" })}`;
    case "boolean":
      return "z.boolean()";
    case "date":
      use(imports, "@stackra/validation", "isoDateTime");
      return "isoDateTime()";
    case "money":
      use(imports, "@stackra/money", "money");
      return "money()";
    case "json":
      use(imports, "@stackra/validation", "json");
      return "json()";
    case "duration":
      use(imports, "@stackra/validation", "duration");
      return "z.string().transform(duration)";
    case "translated": {
      const text = zodOf(context, { kind: "string" }, rules, []);
      if (type.form === "strings")
        return `z.record(z.string(), ${text}).transform((values) => ({ values }))`;
      use(imports, "@stackra/model", "Translated");
      return `z.record(z.string(), ${text}).transform((values) => Translated.of(values))`;
    }
    case "upload":
      use(imports, "@stackra/media", "Upload");
      return "Upload.schema";
    case "brand":
      if (type.brand === "url") {
        use(imports, "@stackra/validation", "url");
        return "url()";
      }
      if (type.brand === "currency_code") {
        use(imports, "@stackra/money", "currencyCode");
        return "currencyCode()";
      }
      use(imports, "@stackra/contracts", "Email", true);
      return "z.email().transform((value) => value as Email)";
    case "public_id":
      if (type.prefix === "" && type.prefixes === undefined) {
        use(imports, "@stackra/contracts", "PublicId", true);
        // Any registered prefix: the format of `publicId(prefix)` in @stackra/validation, prefix left open.
        return "z.string().regex(/^[a-z]{2,6}_[0-9a-hjkmnp-tv-z]{26}$/i).transform((value) => value as PublicId)";
      }
      use(imports, "@stackra/validation", "publicId");
      return type.prefixes === undefined
        ? `publicId(${JSON.stringify(type.prefix)})`
        : `z.union([${type.prefixes.map((prefix) => `publicId(${JSON.stringify(prefix)})`).join(", ")}])`;
    case "enum":
      return type.module === undefined
        ? `z.enum(${JSON.stringify(type.values)})`
        : reference(context, type.module, type.name);
    case "driver_name":
      return `z.enum(${JSON.stringify(type.values)})`;
    case "schema":
      return reference(context, type.module, type.name);
    case "shipped":
      // Aliased so it never collides with a member shape of the same name in this file.
      use(imports, type.from, `${type.name}$ as Shipped${type.name}$`);
      return `Shipped${type.name}$`;
    case "array": {
      const unique = rules.some((rule) => rule.name === "List" && rule.options["unique"] === true)
        ? `.refine((items) => new Set(items.map((item) => JSON.stringify(item))).size === items.length, ` +
          `{ message: "validation::list.unique" })`
        : "";
      return `z.array(${elementOf(context, type.element, each)})${calls(rules, "List", { min: "min", max: "max" })}${unique}`;
    }
    case "record":
      return `z.record(z.string(), ${elementOf(context, type.value, each)})`;
    case "union": {
      const members = type.members.map((member) => reference(context, member.module, member.name));
      return `z.discriminatedUnion(${JSON.stringify(type.discriminator)}, [${members.join(", ")}])`;
    }
    case "hatch":
      return type.source;
  }
}

/** The zod expression of an array element or a map value, with the `each` rules as its own. */
function elementOf(context: Context, type: TypeDesc, rules: readonly FieldRule[]): string {
  return zodOf(context, type, rules, []);
}

/** The zod expression of one field, with its nullability, default or optionality. */
function fieldOf(context: Context, field: FieldIR): string {
  const own = field.rules.filter((rule) => rule.options["each"] !== true);
  const each = field.rules.filter((rule) => rule.options["each"] === true);
  let expression = zodOf(context, field.type, own, each);
  if (field.nullable) expression += ".nullable()";
  if (field.default !== undefined) {
    for (const [name, from] of field.default.imports) use(context.imports, from, name);
    const value = field.default.value;
    // A literal object or array default gets a factory, so two parses never share one instance; a platform
    // constructor's value (Money) is immutable.
    expression +=
      typeof value === "object" && value !== null && field.default.imports.length === 0
        ? `.default(() => (${field.default.code}))`
        : `.default(${field.default.code})`;
  } else if (field.optional) expression += ".exactOptional()";
  return expression;
}

/** The shapes of the module, each after the member shapes of the same module it builds on or refers to. */
function ordered(shapes: readonly ShapeIR[], module: string): ShapeIR[] {
  const own = shapes.filter((shape) => shape.module === module);
  const byName = new Map(own.map((shape) => [shape.name, shape]));
  const done = new Set<string>();
  const visiting = new Set<string>();
  const out: ShapeIR[] = [];
  const dependsOn = (type: TypeDesc): string[] => {
    if (type.kind === "schema") return type.module === module ? [type.name] : [];
    if (type.kind === "array") return dependsOn(type.element);
    if (type.kind === "record") return dependsOn(type.value);
    if (type.kind === "union")
      return type.members.filter((member) => member.module === module).map((member) => member.name);
    return [];
  };
  const visit = (shape: ShapeIR): void => {
    if (done.has(shape.name) || visiting.has(shape.name)) return; // a cycle is emitted with z.lazy
    visiting.add(shape.name);
    const base =
      shape.base?.kind === "member" && shape.base.module === module ? [shape.base.name] : [];
    for (const name of [...base, ...shape.fields.flatMap((field) => dependsOn(field.type))]) {
      const target = byName.get(name);
      if (target !== undefined) visit(target);
    }
    visiting.delete(shape.name);
    done.add(shape.name);
    out.push(shape);
  };
  for (const shape of own) visit(shape);
  return out;
}

/** The `X$` declaration of one shape and its `X$Check`. */
function shapeOf(context: Context, shape: ShapeIR): string[] {
  const lines = [`/** ${shape.kind} \`${shape.name}\` (${shape.file}). */`];
  const body = shape.fields.map((field) => `  ${field.name}: ${fieldOf(context, field)},`);
  const base = shape.base;
  if (base?.kind === "package") {
    const alias = `Base${base.name}$`;
    use(context.imports, base.from, `${base.name}$ as ${alias}`);
    const overrides = shape.fields.map((field) => {
      if (field.default === undefined) return `  ${field.name}: ${alias}.shape.${field.name},`;
      for (const [name, from] of field.default.imports) use(context.imports, from, name);
      return `  ${field.name}: ${alias}.shape.${field.name}.default(${field.default.code}),`;
    });
    lines.push(`export const ${shape.name}$ = ${alias}.extend({`, ...overrides, "});");
  } else if (base?.kind === "member") {
    const parent = reference(context, base.module, base.name).replace(
      /^z\.lazy\(\(\) => (.*)\)$/,
      "$1",
    );
    lines.push(`export const ${shape.name}$ = ${parent}.extend({`, ...body, "});");
  } else lines.push(`export const ${shape.name}$ = z.object({`, ...body, "});");
  context.declared.add(shape.name);
  const fields =
    shape.relations.length > 0
      ? `Omit<Fields<${shape.name}>, ${shape.relations.map((name) => JSON.stringify(name)).join(" | ")}>`
      : `Fields<${shape.name}>`;
  lines.push(
    `export type ${shape.name}$Check = Assert<Same<z.output<typeof ${shape.name}$>, ${fields}>>;`,
    "",
  );
  return lines;
}

/**
 * The schemas file of one module.
 *
 * @param ir - the member read by discovery.
 * @param module - the module key whose shapes, enums and configs the file holds.
 * @example
 * emitSchemas(ir, "orders"); // the content of `.stackra/gen/schemas/orders.ts`
 */
export function emitSchemas(ir: MemberIR, module: string): string {
  const imports: Imports = new Map();
  const context: Context = { module, imports, declared: new Set() };
  use(imports, "zod", "z");
  const body: string[] = [];
  for (const declaration of ir.enums.filter((candidate) => candidate.module === module)) {
    body.push(
      `/** enum \`${declaration.name}\` (${declaration.file}), codes in source order. */`,
      `export const ${declaration.name}$ = z.enum(${JSON.stringify(declaration.values)});`,
      "",
    );
    context.declared.add(declaration.name);
  }
  const shapes = ordered(ir.shapes, module);
  for (const shape of shapes) {
    body.push(...shapeOf(context, shape));
    use(imports, shape.importPath, shape.name, shape.kind === "config");
  }
  for (const declaration of ir.classes) {
    const schema = declaration.options["schema"] as ClassValue | undefined;
    if (declaration.kind !== "config" || declaration.module !== module || schema === undefined)
      continue;
    const target = ir.shapes.find((shape) => shape.name === schema.$class);
    if (target === undefined) continue;
    body.push(
      `/** config \`${declaration.name}\` (${declaration.file}): the schema of its \`Config({ schema })\`. */`,
      `export const ${declaration.name}$ = ${reference(context, target.module, target.name)};`,
      "",
    );
  }
  for (const declaration of ir.classes) {
    if (
      (declaration.kind !== "action" && declaration.kind !== "query") ||
      declaration.module !== module
    )
      continue;
    const find = (name: string | undefined): ShapeIR | undefined =>
      name === undefined
        ? undefined
        : (ir.shapes.find((shape) => shape.name === name && shape.module === module) ??
          ir.shapes.find((shape) => shape.name === name));
    const parts = (
      [
        ["input", find(declaration.handle?.input)],
        ["output", find(declaration.handle?.output)],
      ] as const
    )
      .filter((entry): entry is readonly ["input" | "output", ShapeIR] => entry[1] !== undefined)
      .map(([side, shape]) => `${side}: ${reference(context, shape.module, shape.name)}`);
    body.push(
      `/** ${declaration.kind} \`${declaration.name}\` (${declaration.file}): the schemas of its \`handle\`. */`,
      `export const ${declaration.name}$ = { ${parts.join(", ")} } as const;`,
      "",
    );
  }
  const registered = shapes.filter((shape) => shape.kind !== "config");
  if (registered.length > 0) {
    use(imports, "@stackra/validation", "registerSchemas");
    body.push(
      "/** Links each class to its schema, for `validate`, `X.create()` and `schemaOf` (gap G1). */",
      "registerSchemas([",
      ...registered.map((shape) => `  [${shape.name}, ${shape.name}$],`),
      "]);",
      "",
    );
  }
  const changes = ir.classes.filter(
    (declaration) =>
      declaration.kind === "change" &&
      declaration.module === module &&
      declaration.partner !== undefined,
  );
  if (changes.length > 0) {
    use(imports, "@stackra/versioning", "registerChanges");
    const pairs: string[] = [];
    for (const change of changes) {
      const subject = change.partner;
      if (subject === undefined) continue;
      use(imports, subject.from, subject.name);
      use(imports, change.importPath, change.name);
      pairs.push(`  [${subject.name}, ${change.name}],`);
    }
    body.push(
      "/** Links each subject to its change classes, for `downgrade`, `upgrade` and `resolveVersion`. */",
      "registerChanges([",
      ...pairs,
      "]);",
      "",
    );
  }
  if (shapes.length > 0) {
    for (const name of ["Assert", "Fields", "Same"])
      use(imports, "@stackra/validation", name, true);
  }
  const header = generatedHeader({
    from: `the shape classes of module ${module}`,
    purpose:
      `one zod schema per enum and shape class of module \`${module}\` (\`X$\`), and a type assertion per shape ` +
      "(`X$Check`) that proves the schema's output equals the class's fields.",
    boundary:
      "the module's file of `#stackra/schemas`; names are qualified by the file. Authored code never imports it: " +
      "`validate(X, raw)` and `X.create()` find a schema through the registry this file fills.",
    runtime: "isomorphic",
  });
  return [header, ...importLines(imports), "", ...body].join("\n").replace(/\n+$/, "\n");
}
