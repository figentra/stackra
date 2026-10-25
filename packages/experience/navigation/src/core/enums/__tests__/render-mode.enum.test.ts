/**
 * Stackra file contract:
 * Purpose: unit tests of `RenderMode`: server and client, as the web app's config and catch-all route name them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "vitest";

import { RenderMode } from "#core/enums/render-mode.enum";

describe("RenderMode", () => {
  it("lists the render modes", () => {
    expect(Enum.values(RenderMode)).toEqual(["server", "client"]);
    expect(RenderMode.Client).toBe("client");
  });
});
