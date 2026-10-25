/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the template's mobile screens import `DocumentRenderer` and
 *          its blocks the `BlockProps` type, and the generated native wiring imports `NativeRendererDriver`; nothing
 *          else is exported.
 * Boundary: test only; `@stackra/ui/native` and `@stackra/clients/react` are empty stand-ins, so only the exports are
 *           checked.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { vi } from "vitest";

import * as native from "#native/index";
import type { DocumentRendererProps } from "#native/index";

vi.mock("@stackra/clients/react", () => ({ useQuery: () => ({ data: undefined, error: null }) }));
vi.mock("@stackra/ui/native", () => ({ Skeleton: () => null }));

describe("@stackra/experience/native", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(native).sort()).toEqual(["DocumentRenderer", "NativeRendererDriver"]);
  });

  it("types the renderer's props", () => {
    expectTypeOf<DocumentRendererProps["document"]>().toBeUnknown();
  });
});
