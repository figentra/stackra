// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `usePushPermission()`: `null` without a `PushTransport`; otherwise the permission read on
 *          mount, a request that updates it, and the OS settings call.
 * Boundary: test only; jsdom with Testing Library's `renderHook` over the memory push transport.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0255 (decision 3).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import { PushTransport } from "#contracts/ports/push-transport.port";
import { MemoryPushTransportDriver } from "#core/drivers/memory-push-transport.driver";
import { usePushPermission } from "#react/push-permission/use-push-permission";

/** A provider over `container`. */
function wrapperOf(container: Container) {
  return ({ children }: { readonly children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

describe("usePushPermission", () => {
  it("is null on a target without push", async () => {
    const container = await Container.create([]);
    const { result } = renderHook(() => usePushPermission(), { wrapper: wrapperOf(container) });
    expect(result.current).toBeNull();
  });

  it("reads, requests and opens the settings", async () => {
    const push = new MemoryPushTransportDriver();
    push.status = "denied";
    const container = await Container.create([], { overrides: new Map([[PushTransport, push]]) });
    const { result } = renderHook(() => usePushPermission(), { wrapper: wrapperOf(container) });
    await waitFor(() => expect(result.current?.status).toBe("denied"));
    expect(result.current?.isGranted).toBe(false);
    await act(async () => {
      await result.current?.openSettings();
    });
    expect(push.settingsOpened).toBe(1);
    push.status = "prompt";
    await act(async () => {
      expect(await result.current?.request()).toBe("granted");
    });
    expect(result.current?.isGranted).toBe(true);
  });
});
