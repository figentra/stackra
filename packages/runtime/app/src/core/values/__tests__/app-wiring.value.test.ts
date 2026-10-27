/**
 * Stackra file contract:
 * Purpose: unit tests of `AppWiring`: it keeps the wiring it was given, sections included.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decision 10).
 */
import { describe, expect, it } from "@stackra/testing";

import { AppWiring } from "#core/values/app-wiring.value";

describe("AppWiring", () => {
  it("keeps the wiring as it is", () => {
    const wiring = { member: "web", contexts: ["theming", "i18n"] };
    const holder = new AppWiring(wiring);
    expect(holder.wiring).toBe(wiring);
    expect(holder.wiring.contexts).toEqual(["theming", "i18n"]);
  });
});
