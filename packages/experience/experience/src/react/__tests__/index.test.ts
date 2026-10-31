/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: the template's pages import `DocumentRenderer` and the
 *          generated web wiring imports `ReactRendererDriver`; nothing else is exported.
 * Boundary: test only; `@stackra/ui/react` and `@stackra/clients/react` are empty stand-ins, so only the exports are
 *           checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import * as react from "#react/index";
import type { DocumentRendererProps } from "#react/index";

vi.mock("@stackra/clients/react", () => ({ useQuery: () => ({ data: undefined, error: null }) }));
vi.mock("@stackra/ui/react", () => ({ Skeleton: () => null }));

describe("@stackra/experience/react", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(react).sort()).toEqual([
      "CtaSection",
      "DocumentRenderer",
      "FeatureSection",
      "ReactRendererDriver",
    ]);
  });

  it("types the renderer's props", () => {
    expectTypeOf<DocumentRendererProps["document"]>().toBeUnknown();
  });
});
