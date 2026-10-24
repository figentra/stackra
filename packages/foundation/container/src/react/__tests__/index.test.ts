/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./react` entry: `ContainerProvider` (which the template's server entry
 *          mounts) and `useContainer` are exported, nothing else is, and `ContainerProviderProps` resolves.
 * Boundary: test only; imports the stand-in barrel through its `#react` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as react from "#react/index";
import type { ContainerProviderProps } from "#react/index";

describe("@stackra/container/react", () => {
  it("exports the provider and its hook only", () => {
    expect(Object.keys(react).sort()).toEqual(["ContainerProvider", "useContainer"]);
  });

  it("exports the provider's props type", () => {
    const props: ContainerProviderProps | undefined = undefined;
    expect(props).toBeUndefined();
  });
});
