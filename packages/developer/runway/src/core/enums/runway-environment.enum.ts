/**
 * Stackra file contract:
 * Purpose: the runway environments, the keys of every `environments` map in a root or member runway and the value of
 *          `STACKRA_ENVIRONMENT` that `definesFor` reads.
 * Boundary: an `Enum.of` value plus the type of the same name; a misspelt environment key (`prod`) fails the schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0170 (decision 5: the four environments), ADR 0296, ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The four environments, in promotion order. */
export const RunwayEnvironment = Enum.of({
  /** A developer machine through `stackra dev`; the only environment with dev ports. */
  Dev: "dev",
  /** One deployment per pull request. */
  Preview: "preview",
  /** The pre-production environment every merge to main reaches. */
  Staging: "staging",
  /** The environment customers use, reached by promotion. */
  Production: "production",
});

/** One of the codes above. */
export type RunwayEnvironment = Enum.Value<typeof RunwayEnvironment>;
