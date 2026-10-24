/**
 * Stackra file contract:
 * Purpose: `env`, the environment value parsers for build-time code that runs before a container exists (the
 *          generated Expo `app.config.ts`): `env.str()`, `env.url()` and `env.enum([...])`, each chainable with
 *          `.optional()`, `.default(v)` and `.allowEmpty()`.
 * Boundary: parses one value at a time; it reads no environment itself. Runtime code reads a configuration class
 *           through `hydrateEnv`, `buildConfig` or `useConfig`, never `env`. Folded in from the old `./env` entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 4); ADR 0127 2026-10-24 note (entries).
 */
import type { Url } from "@stackra/contracts";
import { url } from "@stackra/validation";
import { z } from "zod";

import { envValue } from "#core/functions/env-value.function";
import type { EnvValue } from "#core/types/env-value.type";

/**
 * The environment value parsers.
 *
 * @example
 * const environment = env.enum(["dev", "preview", "staging", "production"]).default("dev").parse(process.env.STACKRA_ENVIRONMENT);
 * const appHost = new URL(env.url().parse(process.env.EXPO_PUBLIC_APP_ORIGIN, "EXPO_PUBLIC_APP_ORIGIN")).host;
 */
export const env = Object.freeze({
  /** Any string; an empty one counts as unset unless `.allowEmpty()`. */
  str: (): EnvValue<string> => envValue<string>(z.string()),

  /** An absolute URL with a scheme and an authority (`https://…`, `wss://…`, `acme://…`). */
  url: (): EnvValue<Url> => envValue<Url>(url()),

  /** One of `values`. */
  enum: <const L extends readonly [string, ...string[]]>(values: L): EnvValue<L[number]> =>
    envValue<L[number]>(z.enum(values)),
});
