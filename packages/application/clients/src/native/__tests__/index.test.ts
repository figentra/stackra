/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: `useQuery` and `useAction` are exported and nothing else is;
 *          `useAction` is the isomorphic hook and `useQuery` the native one.
 * Boundary: test only; imports the stand-in barrel through its `#native` alias, with `react-native` stubbed (it does not
 *           load in vitest).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";
import { useAction } from "#react/action/use-action";
import { useQuery } from "#react/query/use-query";

vi.mock("react-native", () => ({
  AppState: { addEventListener: () => ({ remove: () => undefined }) },
}));

describe("@stackra/clients/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["useAction", "useQuery"]);
  });

  it("shares useAction with the react entry and has its own useQuery", () => {
    expect(native.useAction).toBe(useAction);
    expect(native.useQuery).not.toBe(useQuery);
  });
});
