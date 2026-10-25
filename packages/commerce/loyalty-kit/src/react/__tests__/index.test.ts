/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the two web renderers are its values and their Props keep the
 *          shape an app's shadow takes.
 * Boundary: test only; `@stackra/ui/react` is replaced by an empty stand-in, since only the exports are checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import type { BalanceView } from "#core/schemas/balance-view.schema";
import type { PointsIssuedView } from "#core/schemas/points-issued-view.schema";
import * as react from "#react/index";
import type { PointsBalanceProps, PointsIssuedProps } from "#react/index";

vi.mock("@stackra/ui/react", () => ({ Card: () => null, Chip: () => null, Text: () => null }));

describe("@stackra/loyalty-kit/react", () => {
  it("exports exactly its two renderers", () => {
    expect(Object.keys(react).sort()).toEqual(["PointsBalance", "PointsIssued"]);
  });

  it("types the renderers' Props", () => {
    expectTypeOf<PointsBalanceProps["data"]>().toEqualTypeOf<BalanceView | undefined>();
    expectTypeOf<PointsIssuedProps["data"]>().toEqualTypeOf<PointsIssuedView | undefined>();
    expectTypeOf<PointsIssuedProps["isRefreshing"]>().toEqualTypeOf<boolean>();
  });
});
