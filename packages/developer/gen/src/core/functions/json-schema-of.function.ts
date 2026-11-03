/**
 * Stackra file contract:
 * Purpose: `jsonSchemaOf`, the JSON Schema of one shape as the manifest's `schemas` section records it: one object
 *          with its required fields and properties, enums and shapes by `$ref` to `#/schemas/<module>.<Name>`, rules as
 *          JSON Schema keywords and defaults as their wire values. A shape that extends a member shape is flattened, and
 *          one that extends or derives from a consumed (remote) shape starts from that shape's schema in the
 *          consumed service's committed manifest (STA-2060).
 *          A `Translated` field is a locale-to-text map (`@Str` rules on each text) and an `Upload<Bucket>` field the
 *          token object `{ id: "upl_…" }`, each marked with `x-stackra-type` (and the bucket with `x-stackra-bucket`). A field typed with a package's shipped
 *          `X$` is `{ "x-stackra-schema": "<specifier>#X$" }` (STA-1290).
 * Boundary: pure. A `@Hidden` field is left out (stackra-260). A config's shape is never passed here (ADR 0305 rule 34: a schema bound to a Config never reaches a
 *           wire surface); `buildManifest` leaves configs out.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 10 and 26; amendment 2026-10-26: a bare `PublicId` is any prefix, a union
 *                     its prefixes); ADR 0158 (openapi.json is a projection of the manifest); ADR 0162 (decision 2);
 *                     ADR 0222 (decision 2); ADR 0135 (public ids are Crockford base32); ADR 0260 (decision 2); STA-1365 (an `I18nKey` is a plain string).
 */
import type { Json, StackraManifest } from "@stackra/contracts";
import { pascalCase } from "@stackra/support";

import type { FieldIR } from "#core/types/field-ir.type";
import type { FieldRule } from "#core/types/field-rule.type";
import type { MemberIR } from "#core/types/member-ir.type";
import type { RegexValue } from "#core/types/regex-value.type";
import type { ShapeIR } from "#core/types/shape-ir.type";
import type { TypeDesc } from "#core/types/type-desc.type";

/** A JSON object under construction. */
type JsonObject = { [key: string]: Json };

/** The Crockford base32 body of a public id, either case: no I, L, O or U (ADR 0135). */
const PUBLIC_ID_BODY = "[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}";

/** The option `key` of the rule named `name`, when that rule is present and sets it. */
function option(rules: readonly FieldRule[], name: string, key: string): unknown {
  return rules.find((rule) => rule.name === name)?.options[key];
}

/** Copies the options of `rules` named in `keywords` onto `schema` as JSON Schema keywords. */
function keywords(
  schema: JsonObject,
  rules: readonly FieldRule[],
  name: string,
  map: Readonly<Record<string, string>>,
): JsonObject {
  for (const [key, keyword] of Object.entries(map)) {
    const value = option(rules, name, key);
    if (value === undefined) continue;
    schema[keyword] =
      typeof value === "object" && value !== null && "$regex" in value
        ? (value as RegexValue).$regex
        : (value as Json);
  }
  return schema;
}

/** The `$ref` of a member shape or enum. */
function ref(module: string, name: string): JsonObject {
  return { $ref: `#/schemas/${module}.${name}` };
}

/** The JSON Schema of one type, with the rules that apply at its level and those for its elements. */
function typeSchema(
  type: TypeDesc,
  rules: readonly FieldRule[],
  each: readonly FieldRule[],
): JsonObject {
  switch (type.kind) {
    case "string": {
      return keywords({ type: "string" }, rules, "Str", {
        min: "minLength",
        max: "maxLength",
        pattern: "pattern",
      });
    }
    case "number": {
      const isInt = rules.some((rule) => rule.name === "Int");
      return isInt
        ? keywords({ type: "integer" }, rules, "Int", { min: "minimum", max: "maximum" })
        : keywords({ type: "number" }, rules, "Num", {
            min: "minimum",
            max: "maximum",
            exclusiveMin: "exclusiveMinimum",
          });
    }
    case "boolean": {
      return { type: "boolean" };
    }
    case "date": {
      return { type: "string", format: "date-time" };
    }
    case "money": {
      return {
        type: "object",
        required: ["minor", "currency"],
        properties: {
          minor: { type: "integer" },
          currency: { type: "string", pattern: "^[A-Z]{3}$" },
        },
      };
    }
    case "json": {
      return {};
    }
    case "duration": {
      return { type: "string", format: "duration" };
    }
    case "translated": {
      return {
        type: "object",
        additionalProperties: typeSchema({ kind: "string" }, rules, []),
        "x-stackra-type": "translated",
      };
    }
    case "upload": {
      return {
        type: "object",
        required: ["id"],
        properties: { id: typeSchema({ kind: "public_id", prefix: "upl" }, [], []) },
        "x-stackra-type": "upload",
        ...(type.bucket === undefined ? {} : { "x-stackra-bucket": type.bucket }),
      };
    }
    case "brand": {
      if (type.brand === "i18n_key") return { type: "string" };
      return type.brand === "currency_code"
        ? { type: "string", pattern: "^[A-Z]{3}$" }
        : { type: "string", format: type.brand === "url" ? "uri" : "email" };
    }
    case "public_id": {
      return {
        type: "string",
        pattern: `^${type.prefixes !== undefined ? `(${type.prefixes.join("|")})` : type.prefix === "" ? "[a-z]{2,6}" : type.prefix}_${PUBLIC_ID_BODY}$`,
      };
    }
    case "enum": {
      return type.module === undefined
        ? { type: "string", enum: [...type.values] }
        : ref(type.module, type.name);
    }
    case "driver_name": {
      return { type: "string", enum: [...type.values] };
    }
    case "schema": {
      return ref(type.module, type.name);
    }
    case "shipped": {
      // No local `$ref`: the package's schema is the contract; `zodOfJsonSchema` imports it back.
      return { "x-stackra-schema": `${type.from}#${type.name}$` };
    }
    case "array": {
      return keywords(
        {
          type: "array",
          items: elementSchema(type.element, each),
          ...(option(rules, "List", "unique") === true ? { uniqueItems: true } : {}),
        },
        rules,
        "List",
        { min: "minItems", max: "maxItems" },
      );
    }
    case "record": {
      return { type: "object", additionalProperties: elementSchema(type.value, each) };
    }
    case "union": {
      return {
        oneOf: type.members.map((member) => ref(member.module, member.name)),
        discriminator: { propertyName: type.discriminator },
      };
    }
    case "hatch": {
      return { description: "@Field(zod): described by its zod schema" };
    }
  }
}

/** The JSON Schema of an array element or a map value, with the `each` rules as its own. */
function elementSchema(type: TypeDesc, rules: readonly FieldRule[]): JsonObject {
  return typeSchema(type, rules, []);
}

/** The JSON Schema of one field. */
function fieldSchema(field: FieldIR): JsonObject {
  const own = field.rules.filter((rule) => rule.options["each"] !== true);
  const each = field.rules.filter((rule) => rule.options["each"] === true);
  let schema = typeSchema(field.type, own, each);
  if (field.nullable)
    schema =
      typeof schema["type"] === "string"
        ? { ...schema, type: [schema["type"], "null"] }
        : { anyOf: [schema, { type: "null" }] };
  if (field.default !== undefined) schema = { ...schema, default: field.default.value as Json };
  return schema;
}

/** The schema of the consumed shape `name` in `services`, found as `emit-clients` names it. */
function remoteSchemaOf(
  services: MemberIR["services"],
  from: string,
  name: string,
): Record<string, Json> | undefined {
  const service = from.split("/").pop();
  const manifest: StackraManifest | undefined = services?.find(
    (candidate) => candidate.member === service || candidate.folder === service,
  )?.manifest;
  const schemas = manifest?.schemas;
  if (typeof schemas !== "object" || schemas === null) return undefined;
  const keys = Object.keys(schemas);
  const plain = keys.filter((key) => key.split(".").pop() === name);
  const key =
    plain.length === 1
      ? plain[0]
      : keys.find((candidate) => {
          const [module = "", short = ""] = candidate.split(".");
          return `${pascalCase(module)}${short}` === name;
        });
  const found = key === undefined ? undefined : (schemas as Record<string, Json>)[key];
  return typeof found === "object" && found !== null && !Array.isArray(found) ? found : undefined;
}

/**
 * The JSON Schema of `shape`.
 *
 * @param shape - the shape to describe.
 * @param shapes - every shape of the member, to flatten the fields of a member base.
 * @param services - the consumed services' manifests, to start a shape on a remote base from that base's fields.
 * @example
 * jsonSchemaOf(cancelOrderInput, ir.shapes);
 * // { type: "object", required: ["orderId"], properties: { orderId: { type: "string", pattern: "^ord_..." } } }
 */
export function jsonSchemaOf(
  shape: ShapeIR,
  shapes: readonly ShapeIR[],
  services?: MemberIR["services"],
): Json {
  const fields = new Map<string, FieldIR>();
  const chain: ShapeIR[] = [];
  for (let current: ShapeIR | undefined = shape; current !== undefined;) {
    if (chain.includes(current)) break;
    chain.unshift(current);
    const base: ShapeIR["base"] = current.base;
    current =
      base?.kind === "member"
        ? shapes.find((other) => other.name === base.name && other.module === base.module)
        : undefined;
  }
  const properties: JsonObject = {};
  const required = new Set<string>();
  // A consumed base: its fields after its pick, omit or partial derivation, under the shape's own.
  const remote = chain[0]?.base;
  if (remote?.kind === "remote") {
    const found = remoteSchemaOf(services, remote.from, remote.name);
    const given = found?.["properties"];
    if (typeof given === "object" && given !== null && !Array.isArray(given)) {
      const keys = remote.derive?.keys ?? [];
      for (const [name, schema] of Object.entries(given)) {
        if (remote.derive?.helper === "PickType" && !keys.includes(name)) continue;
        if (remote.derive?.helper === "OmitType" && keys.includes(name)) continue;
        properties[name] = schema;
        if (Array.isArray(found?.["required"]) && found["required"].includes(name))
          if (remote.derive?.helper !== "PartialType") required.add(name);
      }
    }
  }
  for (const link of chain)
    for (const field of link.fields)
      // A `@Hidden` field is not on the wire (stackra-260).
      if (field.hidden === true) {
        fields.delete(field.name);
        Reflect.deleteProperty(properties, field.name);
        required.delete(field.name);
      } else fields.set(field.name, field);
  for (const name of Object.keys(properties)) if (fields.has(name)) required.delete(name);
  for (const field of fields.values()) {
    properties[field.name] = fieldSchema(field);
    if (!field.optional && field.default === undefined) required.add(field.name);
  }
  return {
    type: "object",
    ...(required.size > 0 ? { required: [...required] } : {}),
    properties,
  };
}
