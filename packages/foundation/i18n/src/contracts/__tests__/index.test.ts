/**
 * Stackra file contract:
 * Purpose: entry test of `@stackra/i18n/contracts`: it exports exactly the three provider ports, each an abstract
 *          `Port` a driver extends.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15); ADR 0236; OS-182.
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/i18n/contracts", () => {
  it("exports the provider ports", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "AddressAutocomplete",
      "Geocoder",
      "TranslationProvider",
    ]);
    for (const port of Object.values(contracts)) expect(port.prototype).toBeInstanceOf(Port);
  });

  it("lets a driver implement a port", async () => {
    class EchoTranslator extends contracts.TranslationProvider {
      async translate(request: contracts.TranslationRequest): Promise<readonly string[]> {
        return request.messages;
      }
    }
    await expect(
      new EchoTranslator().translate({ messages: ["Hi {name}"], from: "en", to: "ar" }),
    ).resolves.toEqual(["Hi {name}"]);
  });
});
