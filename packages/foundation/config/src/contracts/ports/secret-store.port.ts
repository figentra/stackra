/**
 * Stackra file contract:
 * Purpose: the SecretStore port: where a `@Secret("NAME")` field's value comes from. The runtime binds the driver of
 *          its target (Encore secrets, the Worker's bindings, Infisical in local dev), so config never knows the store.
 * Boundary: an abstract class that is its own token. It resolves one name to one value and lists nothing, so no caller
 *           can enumerate secrets. Lives in `contracts/`, the `./contracts` entry (the other entries
 *           are `.`, `./react`, `./testing`; ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (nobody reads a value), ADR 0146 as amended by 0305 (rule 34), ADR 0294 (decisions 16
 *                     and 17).
 */
import { Port } from "@stackra/contracts";

/** Resolves a secret by its name, blind: the caller holds the value, never a list of them. */
export abstract class SecretStore extends Port {
  /**
   * The value of the secret `name` (SCREAMING_SNAKE, such as `RESEND_API_KEY`).
   * @returns undefined when the store has no such secret.
   */
  abstract get(name: string): string | undefined;
}
