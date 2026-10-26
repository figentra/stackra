/**
 * Stackra file contract:
 * Purpose: unit tests of `useLaunchedFiles()`: the files of the latest launch, empty before one, re-rendered when a
 *          new launch replaces them.
 * Boundary: test only; jsdom with Testing Library's `renderHook` over a memory platform.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0255 (file handlers).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { Platform } from "#contracts/ports/platform.port";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import { useLaunchedFiles } from "#react/launched-files/use-launched-files";

describe("useLaunchedFiles", () => {
  it("returns the latest launch's files", async () => {
    const platform = new MemoryPlatformDriver();
    const container = await Container.create([], { overrides: new Map([[Platform, platform]]) });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <ContainerProvider container={container}>{children}</ContainerProvider>
    );
    const { result } = renderHook(() => useLaunchedFiles(), { wrapper });
    expect(result.current).toEqual([]);
    const file = new File(["png"], "photo.png");
    act(() => platform.fileHandling.launched.set([file]));
    expect(result.current).toEqual([file]);
  });
});
