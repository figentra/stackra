/**
 * Stackra file contract:
 * Purpose: `EnvMap<S>`, the `env` option of `Config({ schema, env })`: a field of the schema to the environment
 *          variable that sets it (`{ ledger: "STACKRA_LOYALTY_KIT_LEDGER" }`).
 * Boundary: a type only. Keys are the schema's data fields; a secret field never appears here (it is named by
 *           `@Secret`), which `buildConfig` refuses at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 34: `env` retires `@Env`); ADR 0231 d4 (variable prefixes).
 */
import type { Fields, Schema } from "@stackra/validation";

/** Field name to environment variable name. */
export type EnvMap<S extends Schema> = { readonly [K in keyof Fields<S>]?: string };
