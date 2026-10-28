/**
 * Stackra file contract:
 * Purpose: `PackSchemaRegistry`, the section schemas a pack is checked against before it is signed: every entry,
 *          subject and review key must sit under a registered prefix and be declared there, every value must pass its
 *          key's JSON Schema, and a root pack must carry every key its schemas require.
 * Boundary: a value built with `PackSchemaRegistry.create`, holding no I/O. The schemas are data registered by their
 *           owners (OS for base sections, products for theirs); nothing market-specific is written here. The check
 *           returns every issue and never throws. Each JSON Schema is compiled once, with zod's `fromJSONSchema`.
 *           A `*` segment in a declared key stands for any one segment (`providers.*` declares `providers.sms`); an
 *           exact key wins over a `*` key and a `*` key is never required. Refuses a repeated prefix, a key outside
 *           its prefix, a key declared twice or a required `*` key with a RangeError.
 * Runtime: isomorphic
 * Governing contract: ADR 0417 (X2-19: the section schema registry); ADR 0370 (decisions 1 and 4); ADR 0328 (values
 *                     are built with `create`).
 */
import { z } from "zod";

import { PackIssueCode } from "#core/enums/pack-issue-code.enum";
import type { MarketPack } from "#core/types/market-pack.type";
import type { PackIssue } from "#core/types/pack-issue.type";
import type { PackSchema } from "#core/types/pack-schema.type";

/** A declared key with its compiled schema. */
type Declared = {
  readonly owner: PackSchema;
  readonly check: z.ZodType;
  readonly required: boolean;
};

/** True when `key` is `prefix` or sits under it. */
const under = (key: string, prefix: string): boolean =>
  key === prefix || key.startsWith(`${prefix}.`);

/** True when `key` fits `pattern` segment for segment, `*` fitting any one segment. */
const fits = (key: string, pattern: string): boolean => {
  const segments = key.split(".");
  const wanted = pattern.split(".");
  return (
    segments.length === wanted.length &&
    wanted.every((segment, at) => segment === "*" || segment === segments[at])
  );
};

/** True when `key` has a `*` segment. */
const wild = (key: string): boolean => key.split(".").includes("*");

/**
 * The registered section schemas.
 *
 * @example
 * const registry = PackSchemaRegistry.create([...osSchemas, ...restaurantSchemas]);
 * const issues = registry.check(pack); // empty when the pack may be signed
 */
export class PackSchemaRegistry {
  /** The schemas, longest prefix first, so the most specific one owns a key. */
  private readonly schemas: readonly PackSchema[];

  /** Every declared key. */
  private readonly keys: ReadonlyMap<string, Declared>;

  /**
   * @param schemas - the registered schemas, longest prefix first.
   * @param keys - every declared key.
   */
  private constructor(schemas: readonly PackSchema[], keys: ReadonlyMap<string, Declared>) {
    this.schemas = schemas;
    this.keys = keys;
  }

  /**
   * A registry over `schemas`.
   *
   * @throws RangeError when a prefix is registered twice, a key is declared twice or sits outside its prefix, a `*`
   *   key is required, or a product section's prefix is outside the section.
   */
  static create(schemas: readonly PackSchema[]): PackSchemaRegistry {
    const prefixes = new Set<string>();
    const keys = new Map<string, Declared>();
    for (const schema of schemas) {
      if (prefixes.has(schema.prefix))
        throw new RangeError(`The prefix ${schema.prefix} is registered twice`);
      prefixes.add(schema.prefix);
      if (schema.section !== undefined && !under(schema.prefix, schema.section))
        throw new RangeError(
          `The prefix ${schema.prefix} is outside its section ${schema.section}`,
        );
      for (const declared of schema.keys) {
        if (!under(declared.key, schema.prefix))
          throw new RangeError(`The key ${declared.key} is outside its prefix ${schema.prefix}`);
        if (keys.has(declared.key))
          throw new RangeError(`The key ${declared.key} is declared twice`);
        if (declared.required === true && wild(declared.key))
          throw new RangeError(`The key ${declared.key} has a * segment and cannot be required`);
        keys.set(declared.key, {
          owner: schema,
          check: z.fromJSONSchema(declared.schema),
          required: declared.required === true,
        });
      }
    }
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    const ordered = [...schemas].sort((left, right) => right.prefix.length - left.prefix.length);
    return new PackSchemaRegistry(ordered, keys);
  }

  /**
   * Every issue of `pack` against the registry; empty when it may be signed.
   *
   * @param pack - a pack version that passed `MarketPack$`.
   */
  check(pack: MarketPack): readonly PackIssue[] {
    const issues: PackIssue[] = [];
    const named = new Set<string>();
    for (const { key } of [...pack.entries, ...pack.reviews, ...(pack.subjects ?? [])]) {
      if (named.has(key)) continue;
      named.add(key);
      // A subject or review may name a whole prefix (`tax.sales`); only entries need a declared key.
      const prefixOnly = !pack.entries.some((entry) => entry.key === key);
      const owner = this.schemas.find((schema) => under(key, schema.prefix));
      if (owner === undefined)
        issues.push({
          code: PackIssueCode.KeyUnregistered,
          key,
          message: `No registered schema covers ${key}`,
        });
      else if (!prefixOnly && this.declared(key) === undefined)
        issues.push({
          code: PackIssueCode.KeyUndeclared,
          key,
          message: `The ${owner.prefix} schema of ${owner.owner} does not declare ${key}`,
        });
    }
    for (const entry of pack.entries) {
      const declared = this.declared(entry.key);
      if (declared === undefined) continue;
      const result = declared.check.safeParse(entry.value);
      if (!result.success)
        issues.push({
          code: PackIssueCode.ValueInvalid,
          key: entry.key,
          message: `${entry.key} from ${entry.from}: ${result.error.issues.map((issue) => issue.message).join("; ")}`,
        });
    }
    if (pack.extends === undefined)
      for (const [key, declared] of this.keys)
        if (
          declared.required &&
          declared.owner.section === pack.section &&
          !pack.entries.some((entry) => entry.key === key)
        )
          issues.push({
            code: PackIssueCode.KeyRequired,
            key,
            message: `A root pack carries ${key}; ${pack.market} has no entry for it`,
          });
    return issues;
  }

  /** The declaration of `key`: its exact key, else the first `*` key it fits. */
  private declared(key: string): Declared | undefined {
    const exact = this.keys.get(key);
    if (exact !== undefined) return exact;
    for (const [pattern, declared] of this.keys)
      if (wild(pattern) && fits(key, pattern)) return declared;
    return undefined;
  }
}
