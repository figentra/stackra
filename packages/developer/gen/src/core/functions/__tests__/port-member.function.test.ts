/**
 * Stackra file contract:
 * Purpose: unit tests of `portMember`: an own import path is the member, a dependency's package or entry is its
 *          manifest's member, and an unknown package is its name in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 26); STA-1605.
 */
import { describe, expect, it } from "@stackra/testing";

import { portMember } from "#core/functions/port-member.function";
import type { MemberIR } from "#core/types/member-ir.type";

const DEPENDENCIES = [
  { package: "@stackra/platform", manifest: { member: "platform" } },
] as unknown as MemberIR["dependencies"];

describe("portMember", () => {
  it("answers the member itself for its own import path", () => {
    expect(portMember("console", DEPENDENCIES, "#contracts/ports/x.port")).toBe("console");
    expect(portMember("console", DEPENDENCIES, "./x.port")).toBe("console");
  });

  it("answers a dependency's manifest member for its package or an entry of it", () => {
    expect(portMember("console", DEPENDENCIES, "@stackra/platform")).toBe("platform");
    expect(portMember("console", DEPENDENCIES, "@stackra/platform/contracts")).toBe("platform");
  });

  it("answers an unknown package's name in snake_case", () => {
    expect(portMember("console", DEPENDENCIES, "@stackra/loyalty-kit/contracts")).toBe(
      "loyalty_kit",
    );
  });
});
