/**
 * Stackra file contract:
 * Purpose: unit tests of `Panel({ path, area })`: the kind record and the refusals of a relative path and an unknown area.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0164 (decision 3); ADR 0082.
 */
import { kindOf } from "@stackra/container";
import { ApiArea } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Panel, PanelBase } from "#core/bases/panel.base";

describe("Panel", () => {
  it("records its mount path and area", () => {
    class CustomerPortalPanel extends Panel({ path: "/portal", area: ApiArea.App }) {}
    expect(kindOf(CustomerPortalPanel)).toEqual({
      kind: "panel",
      options: { path: "/portal", area: "app" },
    });
    expect(new CustomerPortalPanel()).toBeInstanceOf(PanelBase);
  });

  it("refuses a relative path and an unknown area", () => {
    expect(() => Panel({ path: "portal", area: ApiArea.App })).toThrow(TypeError);
    expect(() => Panel({ path: "/", area: "nowhere" as ApiArea })).toThrow(TypeError);
  });
});
