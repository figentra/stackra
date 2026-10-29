/**
 * Stackra file contract:
 * Purpose: unit tests of `useIncomingShare()`: empty before a share, the accepted items after one arrives, and an
 *          empty list after `clear`.
 * Boundary: test only; jsdom with Testing Library's `renderHook` over the memory driver.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0478 (decision 5).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { IncomingShare } from "#contracts/ports/incoming-share.port";
import type { SharedItem } from "#contracts/types/shared-item.type";
import { MemoryIncomingShareDriver } from "#core/drivers/memory-incoming-share.driver";
import { useIncomingShare } from "#react/incoming-share/use-incoming-share";

const TEXT: SharedItem = { kind: "text", value: "hello", mimeType: "text/plain", name: null };

describe("useIncomingShare", () => {
  it("lists a new share and empties on clear", async () => {
    const share = new MemoryIncomingShareDriver();
    const container = await Container.create([], { overrides: new Map([[IncomingShare, share]]) });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <ContainerProvider container={container}>{children}</ContainerProvider>
    );
    const { result } = renderHook(() => useIncomingShare(), { wrapper });
    expect(result.current.items).toEqual([]);
    act(() => share.receive(TEXT));
    await waitFor(() => expect(result.current.items).toEqual([TEXT]));
    await act(() => result.current.clear());
    expect(result.current.items).toEqual([]);
  });
});
