/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `SecretStore` port, the one a test's `useDrivers("memory")` picks: it answers
 *          the secrets a test sets (`set(name, value)`) and nothing else.
 * Boundary: values live in a private map on the instance; there is still no way to list them, so the port's blind
 *           read holds. Starts empty, so a secret a test did not set reads as missing. A deployment binds its target's
 *           store (Encore secrets, the Worker's bindings, Infisical).
 * Runtime: isomorphic
 * Governing contract: ADR 0173 (nobody reads a value; secrets by name); ADR 0266 (memory drivers first); ADR 0269.
 */
import { Driver } from "@stackra/container";

import { SecretStore } from "#contracts/ports/secret-store.port";

/**
 * Secrets in memory, for tests.
 *
 * @example
 * (app.get(SecretStore) as MemorySecretStoreDriver).set("RESEND_API_KEY", "re_test");
 */
export class MemorySecretStoreDriver extends Driver(SecretStore) {
  /** Secret name to value. */
  private readonly values = new Map<string, string>();

  /**
   * Sets the secret `name` (SCREAMING_SNAKE) to `value`; a later call for the same name wins.
   *
   * @returns this driver, to chain.
   */
  set(name: string, value: string): this {
    this.values.set(name, value);
    return this;
  }

  /** The value of `name`, or undefined when no test set it. */
  get(name: string): string | undefined {
    return this.values.get(name);
  }
}
