/**
 * Stackra file contract:
 * Purpose: unit tests of `formatAddress` and `countryName`: lines in the format's order, empty rows dropped, the
 *          country named in the reader's language.
 * Boundary: test only. The format is test data shaped like a market pack's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; OS-370.
 */
import { describe, expect, it } from "@stackra/testing";
import type { AddressFormat } from "@stackra/validation";

import { countryName } from "#core/functions/country-name.function";
import { formatAddress } from "#core/functions/format-address.function";

const format: AddressFormat = {
  required: ["locality"],
  layout: [["lines"], ["district"], ["locality", "postalCode"], ["country"]],
};

describe("formatAddress", () => {
  it("prints in the format's order and drops empty rows", () => {
    expect(
      formatAddress(
        {
          lines: ["12 King Fahd Rd", "Floor 3"],
          locality: "Riyadh",
          postalCode: "12345",
          country: "SA",
        },
        format,
        "en",
      ),
    ).toEqual(["12 King Fahd Rd", "Floor 3", "Riyadh 12345", "Saudi Arabia"]);
  });

  it("names the country in the reader's language", () => {
    expect(countryName("EG", "en")).toBe("Egypt");
    expect(countryName("AA", "en")).toBe("AA");
  });
});
