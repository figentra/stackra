/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: it exports `useUpload` (the template's console) and
 *          `useImageVariant` (the template's web app), nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";

describe("@stackra/media/react", () => {
  it("exports exactly its hooks", () => {
    expect(Object.keys(react).sort()).toEqual(["useImageVariant", "useUpload"]);
  });
});
