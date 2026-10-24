/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useCapability`: an offered facet is handed out, one not offered is `null`, a
 *          required one not offered throws, and a required scanner on a device without a camera is still handed out
 *          with `isAvailable` false (the template's simulator case).
 * Boundary: test only; renders with react-dom/server over a memory platform.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (decisions 2 to 4).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { Platform } from "#contracts/ports/platform.port";
import type { ScannerCapability } from "#contracts/types/scanner-capability.type";
import type { ShareCapability } from "#contracts/types/share-capability.type";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import type { MemoryPlatformOptions } from "#core/types/memory-platform-options.type";
import { useCapability } from "#react/capability/use-capability";

/** Renders `children` over a memory platform with `options`. */
async function renderWith(options: MemoryPlatformOptions, children: ReactNode): Promise<string> {
  const platform = new MemoryPlatformDriver().configure(options);
  const container = await Container.create([], { overrides: new Map([[Platform, platform]]) });
  return renderToString(<ContainerProvider container={container}>{children}</ContainerProvider>);
}

/** Renders the share facet's presence. */
function ShareProbe() {
  return <span>{useCapability("share") === null ? "none" : "share"}</span>;
}

/** Renders the required scanner's camera state. */
function ScannerProbe() {
  return <span>{String(useCapability("scanner", { required: true }).isAvailable)}</span>;
}

describe("useCapability", () => {
  it("hands out an offered facet and null otherwise", async () => {
    expect(await renderWith({}, <ShareProbe />)).toBe("<span>none</span>");
    expect(await renderWith({ capabilities: ["share"] }, <ShareProbe />)).toBe(
      "<span>share</span>",
    );
  });

  it("hands out a required scanner without a camera, and throws when the target lacks it", async () => {
    expect(await renderWith({ scanner: { isAvailable: false } }, <ScannerProbe />)).toBe(
      "<span>false</span>",
    );
    await expect(renderWith({}, <ScannerProbe />)).rejects.toThrow(/required capability "scanner"/);
  });

  it("types the facet, non-null when required", () => {
    expectTypeOf(useCapability<"scanner">).toBeCallableWith("scanner", { required: true });
    expectTypeOf<
      ReturnType<typeof useCapability<"share">>
    >().toEqualTypeOf<ShareCapability | null>();
    expectTypeOf<ScannerCapability>().toHaveProperty("requestPermission");
  });
});
