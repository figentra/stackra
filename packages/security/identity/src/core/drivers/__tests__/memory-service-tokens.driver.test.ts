/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryServiceTokensDriver`: it is the `ServiceTokens` port, answers a seeded audience's token,
 *          refuses any other audience with an error that names no token, and a new seed replaces the old.
 * Boundary: test only; the tokens are throwaway strings.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3); STA-2558.
 */
import { describe, expect, it } from "@stackra/testing";

import { ServiceTokens } from "#contracts/index";
import { MemoryServiceTokensDriver } from "#core/drivers/memory-service-tokens.driver";

describe(MemoryServiceTokensDriver, () => {
  it("is the ServiceTokens port", () => {
    expect(new MemoryServiceTokensDriver()).toBeInstanceOf(ServiceTokens);
  });

  it("answers a seeded audience's token, and refuses any other without naming a token", async () => {
    const tokens = new MemoryServiceTokensDriver().seed({ pay: "throwaway-pay-token" });
    expect(await tokens.for("pay")).toBe("throwaway-pay-token");
    const refusal = await tokens.for("ship").catch((error: unknown) => error);
    expect(String((refusal as Error).message)).toContain("ship");
    expect(String((refusal as Error).message)).not.toContain("throwaway");
    tokens.seed({});
    await expect(tokens.for("pay")).rejects.toThrow(/pay/);
  });
});
