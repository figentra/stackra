/**
 * Stackra file contract:
 * Purpose: `EdgeEnv`: the secret, the vars and the version metadata binding of `stackra-edge`.
 * Boundary: types only; `readSettings` parses the vars.
 * Runtime: worker
 * Governing contract: ADR 0437 (decision 4); ADR 0173 (secrets); ADR 0536 (the version proof).
 */

/** The secret and the vars of `stackra-edge`. */
export interface EdgeEnv {
  /** The newest edge signing secret (sops, ADR 0525); the API's `EdgeSigningKeys` lists it first. */
  readonly EDGE_SIGNING_SECRET: string;
  /** The version metadata binding: the id of the Worker version that runs (STA-2783, the deploy smoke's proof). */
  readonly CF_VERSION_METADATA?: { readonly id: string };
  /** Any other var: wrangler passes a JSON number as a number and a string as a string. */
  readonly [variable: `EDGE_${string}`]: string | number | undefined;
}
