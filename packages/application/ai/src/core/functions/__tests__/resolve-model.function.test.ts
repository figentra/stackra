/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveModel`: the bound driver of the chosen provider builds the model for the route's model
 *          id and region; a refused choice and an unbound provider throw.
 * Boundary: test only; the driver returns AI SDK's mock model.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";
import { MockLanguageModelV4 } from "ai/test";
import { vi } from "vitest";

import { resolveModel } from "#core/functions/resolve-model.function";
import type { ModelProviderDriver } from "#core/types/model-provider-driver.type";
import type { RouteChoice } from "#core/types/route-choice.type";

const choice: RouteChoice = {
  kind: "routed",
  route: { task: "chat", provider: "p", model: "m-1", regions: ["eu"], zeroRetention: true },
  region: "eu",
  disclosed: false,
};

describe("resolveModel", () => {
  it("asks the provider's driver for the model and region", () => {
    const model = new MockLanguageModelV4();
    const driver: ModelProviderDriver = { provider: "p", model: vi.fn(() => model) };
    expect(resolveModel(choice, [driver])).toBe(model);
    expect(driver.model).toHaveBeenCalledWith("m-1", "eu");
  });

  it("throws for a refused choice or a provider with no driver", () => {
    expect(() => resolveModel({ kind: "refused", reason: "no_route" }, [])).toThrow(RangeError);
    expect(() => resolveModel(choice, [])).toThrow(/no driver/);
  });
});
