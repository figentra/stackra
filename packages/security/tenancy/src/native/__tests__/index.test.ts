/**
 * Stackra file contract:
 * Purpose: barrel test of the `./native` entry of @stackra/tenancy: exactly the menu.
 * Boundary: test only. React Native does not load in vitest, so `@stackra/ui/native` is replaced by empty stand-ins;
 *           only the exports are checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";

vi.mock("@stackra/ui/native", () => ({
  Avatar: () => null,
  List: () => null,
  Spinner: () => null,
}));

describe("@stackra/tenancy/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["TenantMenu"]);
  });
});
