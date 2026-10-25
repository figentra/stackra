/**
 * Stackra file contract:
 * Purpose: `hydrateEnv`, what the generated `#stackra/env` calls to turn a raw environment (`import.meta.env`, a
 *          Worker's bindings, `process.env`) into a member's env configuration: with `{ only: "public" }` the public
 *          part for the browser plus the build facts; otherwise the whole validated instance, its secrets resolved by
 *          name from the same raw environment, after any derivations gen wrote.
 * Boundary: the public form reads only variables with a public prefix and returns only the fields mapped to them, so a
 *           server value or a secret never reaches a client bundle. A missing or malformed value throws
 *           `ConfigInvalidError` naming the variable. Folded in from the old `./env` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 10); ADR 0231 (decision 4); ADR 0173; ADR 0127 2026-10-24 note.
 */
import { schemaOf } from "@stackra/validation";
import { z } from "zod";

import type { Config } from "#core/bases/config.base";
import { PUBLIC_ENV_PREFIXES } from "#core/constants/public-env-prefixes.constant";
import { ConfigInvalidError } from "#core/errors/config-invalid.error";
import { configOptionsOf } from "#core/functions/config-options-of.function";
import { issuesOf } from "#core/functions/issues-of.function";
import { layerConfig } from "#core/functions/layer-config.function";
import { sealConfig } from "#core/functions/seal-config.function";
import type { BuildFacts } from "#core/types/build-facts.type";
import type { EnvDerivations } from "#core/types/env-derivations.type";
import type { PublicPart } from "#core/types/public-part.type";

/** Whether a variable name carries a public prefix. */
const isPublic = (name: string) => PUBLIC_ENV_PREFIXES.some((prefix) => name.startsWith(prefix));

/**
 * The public part of `type` read from `raw`, and the build facts.
 *
 * @throws ConfigInvalidError when a public value breaks its rule.
 * @example
 * export const env = hydrateEnv(EnvConfig, import.meta.env, { only: "public" });
 */
export function hydrateEnv<C extends Config>(
  type: new () => C,
  raw: unknown,
  options: { readonly only: "public" },
): PublicPart<C> & BuildFacts;

/**
 * The whole validated instance of `type` read from `raw`, secrets included, after `derivations`.
 *
 * @throws ConfigInvalidError when a value breaks its rule or a required secret is missing.
 * @example
 * export const env = hydrateEnv(EnvConfig, import.meta.env, {
 *   realtimeOrigin: (e) => e.realtimeOrigin || e.apiOrigin,
 * });
 */
export function hydrateEnv<C extends Config>(
  type: new () => C,
  raw: unknown,
  derivations?: EnvDerivations<C>,
): C;

/** Picks the public form for `{ only: "public" }`, the whole instance otherwise. */
export function hydrateEnv(type: new () => Config, raw: unknown, third?: object): object {
  const source = (raw ?? {}) as Readonly<Record<string, unknown>>;
  if ((third as { only?: unknown } | undefined)?.only === "public") {
    const { schema, env } = configOptionsOf(type);
    const fields = Object.keys(env).filter((field) => isPublic(env[field] as string));
    const visible = Object.fromEntries(Object.entries(source).filter(([name]) => isPublic(name)));
    const draft = layerConfig(type, visible, undefined);
    const picked: Record<string, unknown> = {};
    for (const field of fields) if (draft[field] !== undefined) picked[field] = draft[field];
    const shape = schemaOf(schema);
    if (!(shape instanceof z.ZodObject))
      throw new TypeError(`${schema.name}'s generated schema is not an object schema`);
    const rules = Object.fromEntries(
      fields.map((field) => {
        const rule = shape.shape[field];
        if (rule === undefined)
          throw new TypeError(`${schema.name} has no field "${field}" for its env map`);
        return [field, rule] as const;
      }),
    );
    const result = z.object(rules).safeParse(picked);
    if (!result.success)
      throw new ConfigInvalidError(type.name, issuesOf(result.error, env, new Map()));
    const isDevelopment =
      source["DEV"] === true ||
      source["MODE"] === "development" ||
      source["NODE_ENV"] === "development";
    return Object.freeze({ ...(result.data as object), isDevelopment });
  }
  const draft = layerConfig(type, source, undefined);
  for (const [field, derive] of Object.entries(third ?? {}))
    draft[field] = (derive as (env: Record<string, unknown>) => unknown)(draft);
  return sealConfig(type, draft, (name) => {
    const value = source[name];
    return typeof value === "string" ? value : undefined;
  });
}
