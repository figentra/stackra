/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: exactly the native points-balance renderer, whose Props carry
 *          the web renderer's fields.
 * Boundary: test only. React Native does not load in vitest, so `@stackra/ui/native` is replaced by an empty stand-in;
 *           only the exports are checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15); ADR 0302.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";
import type { PointsBalanceProps } from "#native/index";
import type { PointsBalanceProps as WebPointsBalanceProps } from "#react/index";

vi.mock("@stackra/ui/native", () => ({ Card: () => null, Chip: () => null, Text: () => null }));
vi.mock("@stackra/ui/react", () => ({ Card: () => null, Chip: () => null, Text: () => null }));

describe("@stackra/loyalty-kit/native", () => {
  it("exports exactly the points-balance renderer", () => {
    expect(Object.keys(native)).toEqual(["PointsBalance"]);
  });

  it("takes the web renderer's Props, field for field", () => {
    expectTypeOf<PointsBalanceProps>().toEqualTypeOf<WebPointsBalanceProps>();
  });
});
