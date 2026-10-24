/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: it exports `nativeFetch` and nothing else.
 * Boundary: test only; `expo/fetch` is replaced by a stand-in, as it does not load in vitest.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it, vi } from "@stackra/testing";

import * as native from "#native/index";

vi.mock("expo/fetch", () => ({ fetch: vi.fn() }));

describe("@stackra/transport/native", () => {
  it("exports exactly nativeFetch", () => {
    expect(Object.keys(native)).toEqual(["nativeFetch"]);
  });
});
