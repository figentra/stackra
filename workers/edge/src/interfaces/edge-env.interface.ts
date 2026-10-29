/**
 * Stackra file contract:
 * Purpose: `EdgeEnv`: the secret and the vars of `stackra-edge`.
 * Boundary: types only; `readSettings` parses the vars.
 * Runtime: worker
 * Governing contract: ADR 0437 (decision 4); ADR 0173 (secrets).
 */

/** The secret and the vars of `stackra-edge`. */
export interface EdgeEnv {
  /** The newest edge signing secret (Infisical, ADR 0173); the API's `EdgeSigningKeys` lists it first. */
  readonly EDGE_SIGNING_SECRET: string;
  /** Any other var: wrangler passes a JSON number as a number and a string as a string. */
  readonly [variable: `EDGE_${string}`]: string | number | undefined;
}
