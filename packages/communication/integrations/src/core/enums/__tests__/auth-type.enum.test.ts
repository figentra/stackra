/**
 * Stackra file contract:
 * Purpose: unit tests of `AuthType`: exactly the six authentication types of ADR 0308, with their snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 6 and 8).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { AuthType } from "#core/enums/auth-type.enum";

describe("AuthType", () => {
  it("holds exactly the six types", () => {
    expect(Enum.values(AuthType)).toEqual([
      "oauth2_code",
      "oauth2_client_credentials",
      "api_key",
      "basic",
      "jwt",
      "none",
    ]);
  });

  it("types each case as its code", () => {
    expectTypeOf(AuthType.ApiKey).toEqualTypeOf<"api_key">();
    expectTypeOf<AuthType>().toEqualTypeOf<
      "oauth2_code" | "oauth2_client_credentials" | "api_key" | "basic" | "jwt" | "none"
    >();
  });
});
