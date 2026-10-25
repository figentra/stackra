/**
 * Stackra file contract:
 * Purpose: unit tests of `Presentation`: the native presentations, push first as the default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0128 (`Enum.of`).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "vitest";

import { Presentation } from "#core/enums/presentation.enum";

describe("Presentation", () => {
  it("lists the native presentations", () => {
    expect(Enum.values(Presentation)).toEqual(["push", "sheet", "full_screen"]);
    expect(Presentation.FullScreen).toBe("full_screen");
  });
});
