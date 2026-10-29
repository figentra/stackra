/**
 * Stackra file contract:
 * Purpose: unit tests of `useAppIcon()`: `null` without an `AppIcon`; otherwise the configured icons, a switch that
 *          re-renders, and refusing a name the build does not carry.
 * Boundary: test only; jsdom with Testing Library's `renderHook` over the memory app icon driver.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (decision 2).
 */
// @vitest-environment jsdom
import { Container } from "@stackra/container";
import type { Token } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import { AppIconConfig } from "#config/app-icon.config";
import { AppIcon } from "#contracts/ports/app-icon.port";
import { MemoryAppIconDriver } from "#core/drivers/memory-app-icon.driver";
import { useAppIcon } from "#react/app-icon/use-app-icon";

/** A provider over `container`. */
function wrapperOf(container: Container) {
  return ({ children }: { readonly children: ReactNode }) => (
    <ContainerProvider container={container}>{children}</ContainerProvider>
  );
}

/** A host's icon set. */
class SeasonalAppIconConfig extends AppIconConfig {
  override icons = ["Ramadan"];
}

describe("useAppIcon", () => {
  it("is null on a target without an app icon", async () => {
    const container = await Container.create([]);
    const { result } = renderHook(() => useAppIcon(), { wrapper: wrapperOf(container) });
    expect(result.current).toBeNull();
  });

  it("lists the icons, switches and refuses a name the build lacks", async () => {
    const driver = new MemoryAppIconDriver();
    const container = await Container.create([], {
      overrides: new Map<Token, object>([
        [AppIcon, driver],
        [AppIconConfig, new SeasonalAppIconConfig()],
      ]),
    });
    const { result } = renderHook(() => useAppIcon(), { wrapper: wrapperOf(container) });
    expect(result.current?.icons).toEqual(["Ramadan"]);
    expect(result.current?.icon).toBeNull();
    await act(async () => {
      expect(await result.current?.set("Ramadan")).toEqual({ ok: true, data: undefined });
    });
    expect(result.current?.icon).toBe("Ramadan");
    expect(await result.current?.set("Winter")).toEqual({
      ok: false,
      error: { code: "unavailable", capability: "app_icon" },
    });
    expect(driver.current.get()).toBe("Ramadan");
  });
});
