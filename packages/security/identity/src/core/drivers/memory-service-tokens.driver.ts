/**
 * Stackra file contract:
 * Purpose: `MemoryServiceTokensDriver`, a `ServiceTokens` over tokens held in memory per audience, for tests and local
 *          runs.
 * Boundary: process-local; never a production source (that signs in as the service account). Holds no token until
 *           `seed`, so the container builds it with no arguments; an audience it was not given throws an error that
 *           names the audience, never a token.
 * Runtime: isomorphic
 * Governing contract: ADR 0209 (decision 3); ADR 0263 (a driver is named by its class: `memory`); STA-2558.
 */
import { Driver } from "@stackra/container";

import { ServiceTokens } from "#contracts/index";

/**
 * Service tokens in memory.
 *
 * @example
 * const tokens = new MemoryServiceTokensDriver().seed({ "pay-project": "eyJ…" });
 * await tokens.for("pay-project"); // "eyJ…"
 */
export class MemoryServiceTokensDriver extends Driver(ServiceTokens) {
  /** Audience to its token. */
  private tokens = new Map<string, string>();

  /**
   * Sets the token of each audience, replacing any before.
   *
   * @returns this source, to chain.
   */
  seed(tokens: Readonly<Record<string, string>>): this {
    this.tokens = new Map(Object.entries(tokens));
    return this;
  }

  /**
   * Implements `ServiceTokens.for`, documented there.
   *
   * @throws Error for an audience it was not seeded with.
   */
  for(audience: string): Promise<string> {
    const token = this.tokens.get(audience);
    return token === undefined
      ? Promise.reject(new Error(`no service token is seeded for audience ${audience}`))
      : Promise.resolve(token);
  }
}
