/**
 * Stackra file contract:
 * Purpose: unit tests of the `ModelProviders` port: an abstract port class a driver extends to list the bound
 *          provider drivers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0156 (decision 2); STA-1256.
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ModelProviders } from "#core/ports/model-providers.port";
import type { ModelProviderDriver } from "#core/types/model-provider-driver.type";

describe("ModelProviders", () => {
  it("is a port", () => {
    expect(Object.getPrototypeOf(ModelProviders)).toBe(Port);
    expect(ModelProviders.name).toBe("ModelProviders");
  });

  it("lists what a driver binds", () => {
    const bedrock: ModelProviderDriver = {
      provider: "bedrock",
      model: () => {
        throw new Error("not called");
      },
    };
    const providers = new (class extends Driver(ModelProviders) {
      drivers(): readonly ModelProviderDriver[] {
        return [bedrock];
      }
    })();
    expect(providers.drivers().map(({ provider }) => provider)).toEqual(["bedrock"]);
  });
});
