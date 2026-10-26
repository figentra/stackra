/**
 * Stackra file contract:
 * Purpose: `zodOfJsonSchema`, the zod source a generated client prints for one JSON Schema of a producer's manifest:
 *          the inverse of `jsonSchemaOf`, so a consumer decodes with the same helpers the producer's `#stackra/schemas`
 *          uses (`publicId`, `isoDateTime`, `money`, `url`, `duration`, `json`) and a `$ref` prints the name the
 *          caller gives it.
 * Boundary: pure: schema in, source text out, imports recorded through `context.use`. Only the keywords
 *           `jsonSchemaOf` writes are read; anything else decodes as `json()` (the producer still validates the call).
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 2: the manifest is the one contract source); ADR 0158; ADR 0294 (decision 26).
 */

/** A JSON Schema node as the manifest records it. */
type Schema = Readonly<Record<string, unknown>>;

/** What the printer needs from the emitter that calls it. */
export interface ZodPrintContext {
  /** Records one import of the printed file. */
  readonly use: (from: string, name: string) => void;

  /** The zod expression of a `$ref` target (`#/schemas/<module>.<Name>`), or `undefined` when it is not local. */
  readonly ref: (target: string) => string | undefined;
}

/** A public id pattern as `jsonSchemaOf` writes it. */
const PUBLIC_ID = /^\^([a-z]+)_\[0-9A-Za-z\]\{26\}\$$/;

/** Whether `value` is a JSON object. */
function isSchema(value: unknown): value is Schema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The method calls of the keywords in `map` that `schema` sets. */
function calls(schema: Schema, map: Readonly<Record<string, string>>): string {
  return Object.entries(map)
    .filter(([keyword]) => schema[keyword] !== undefined)
    .map(([keyword, method]) =>
      method === "regex"
        ? `.regex(new RegExp(${JSON.stringify(schema[keyword])}))`
        : `.${method}(${JSON.stringify(schema[keyword])})`,
    )
    .join("");
}

/** Whether `schema` is the money object `jsonSchemaOf` writes. */
function isMoney(schema: Schema): boolean {
  const properties = isSchema(schema["properties"]) ? schema["properties"] : {};
  return (
    schema["type"] === "object" &&
    Object.keys(properties).sort().join(",") === "currency,minor" &&
    isSchema(properties["minor"]) &&
    properties["minor"]["type"] === "integer"
  );
}

/** The zod source of one non-null type. */
function typeOf(schema: Schema, type: unknown, context: ZodPrintContext): string {
  const reference = schema["$ref"];
  if (typeof reference === "string") {
    const printed = context.ref(reference);
    if (printed !== undefined) return printed;
    context.use("@stackra/validation", "json");
    return "json()";
  }
  if (Array.isArray(schema["enum"])) return `z.enum(${JSON.stringify(schema["enum"])})`;
  if (Array.isArray(schema["oneOf"])) {
    const members = schema["oneOf"]
      .filter(isSchema)
      .map((member) => zodOfJsonSchema(member, context));
    const discriminator = isSchema(schema["discriminator"])
      ? schema["discriminator"]["propertyName"]
      : undefined;
    return typeof discriminator === "string"
      ? `z.discriminatedUnion(${JSON.stringify(discriminator)}, [${members.join(", ")}])`
      : `z.union([${members.join(", ")}])`;
  }
  switch (type) {
    case "string": {
      const pattern = typeof schema["pattern"] === "string" ? schema["pattern"] : undefined;
      const prefix = pattern === undefined ? undefined : PUBLIC_ID.exec(pattern)?.[1];
      if (prefix !== undefined) {
        context.use("@stackra/validation", "publicId");
        return `publicId(${JSON.stringify(prefix)})`;
      }
      if (schema["format"] === "date-time") {
        context.use("@stackra/validation", "isoDateTime");
        return "isoDateTime()";
      }
      if (schema["format"] === "uri") {
        context.use("@stackra/validation", "url");
        return "url()";
      }
      if (schema["format"] === "email") return "z.email()";
      if (schema["format"] === "duration") {
        context.use("@stackra/validation", "duration");
        return "z.string().transform(duration)";
      }
      return `z.string()${calls(schema, { minLength: "min", maxLength: "max", pattern: "regex" })}`;
    }
    case "integer":
      return `z.number().int()${calls(schema, { minimum: "min", maximum: "max" })}`;
    case "number":
      return `z.number()${calls(schema, { minimum: "min", maximum: "max", exclusiveMinimum: "gt" })}`;
    case "boolean":
      return "z.boolean()";
    case "array":
      return `z.array(${isSchema(schema["items"]) ? zodOfJsonSchema(schema["items"], context) : "z.unknown()"})${calls(schema, { minItems: "min", maxItems: "max" })}`;
    case "object": {
      if (isMoney(schema)) {
        context.use("@stackra/money", "money");
        return "money()";
      }
      if (isSchema(schema["additionalProperties"]))
        return `z.record(z.string(), ${zodOfJsonSchema(schema["additionalProperties"], context)})`;
      const properties = isSchema(schema["properties"]) ? schema["properties"] : {};
      const required = new Set(Array.isArray(schema["required"]) ? schema["required"] : []);
      const fields = Object.entries(properties)
        .filter((entry): entry is [string, Schema] => isSchema(entry[1]))
        .map(([name, field]) => {
          const printed = zodOfJsonSchema(field, context);
          const tail =
            field["default"] !== undefined
              ? `.default(${JSON.stringify(field["default"])})`
              : required.has(name)
                ? ""
                : ".optional()";
          return `${JSON.stringify(name)}: ${printed}${tail}`;
        });
      return `z.object({ ${fields.join(", ")} })`;
    }
    default:
      context.use("@stackra/validation", "json");
      return "json()";
  }
}

/**
 * The zod source of `schema`.
 *
 * @param schema - one JSON Schema of the producer's manifest.
 * @param context - the import recorder and the `$ref` resolver of the printed file.
 * @example
 * zodOfJsonSchema({ type: ["string", "null"], minLength: 1 }, context); // 'z.string().min(1).nullable()'
 */
export function zodOfJsonSchema(schema: Schema, context: ZodPrintContext): string {
  const type = schema["type"];
  if (Array.isArray(type) && type.includes("null")) {
    const rest = type.filter((item) => item !== "null");
    return `${typeOf(schema, rest.length === 1 ? rest[0] : undefined, context)}.nullable()`;
  }
  if (Array.isArray(schema["anyOf"])) {
    const members = schema["anyOf"].filter(isSchema);
    const value = members.find((member) => member["type"] !== "null");
    if (members.length === 2 && value !== undefined && members.some((m) => m["type"] === "null"))
      return `${zodOfJsonSchema(value, context)}.nullable()`;
  }
  return typeOf(schema, type, context);
}
