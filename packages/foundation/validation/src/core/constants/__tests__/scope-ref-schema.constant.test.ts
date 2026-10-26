/**
 * Stackra file contract:
 * Purpose: unit tests of `SCOPE_REF_SCHEMA` (`ScopeRef$`): an `scp_` id with a dotted path parses, and another prefix or
 *          a malformed path is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { SCOPE_REF_SCHEMA } from "#core/constants/scope-ref-schema.constant";

describe("ScopeRef$", () => {
  it("parses a scope node", () => {
    const ref = { id: "scp_01HZX3K9M2Q7R8S5T6V4W1Y0AB", path: "platform.acme.shop_eu" };
    expect(SCOPE_REF_SCHEMA.parse(ref)).toEqual(ref);
  });

  it("refuses another prefix or a malformed path", () => {
    expect(
      SCOPE_REF_SCHEMA.safeParse({ id: "usr_01HZX3K9M2Q7R8S5T6V4W1Y0AB", path: "platform" })
        .success,
    ).toBe(false);
    expect(
      SCOPE_REF_SCHEMA.safeParse({ id: "scp_01HZX3K9M2Q7R8S5T6V4W1Y0AB", path: "platform..acme" })
        .success,
    ).toBe(false);
  });
});
