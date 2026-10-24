/**
 * Stackra file contract:
 * Purpose: unit tests of `ScannerView`: it renders the running platform's scanner view with its props, so the memory
 *          platform's `emit` reaches the page's `onBarcode` (the template's scan test).
 * Boundary: test only; renders with react-dom/server over a memory platform.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0250 (decision 2).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { renderToString } from "react-dom/server";

import { Platform } from "#contracts/ports/platform.port";
import { MemoryPlatformDriver } from "#core/drivers/memory-platform.driver";
import { ScannerView } from "#react/scanner-view/scanner-view";

describe("ScannerView", () => {
  it("renders the driver's view with the page's handler", async () => {
    const platform = new MemoryPlatformDriver().configure({ scanner: { permission: "granted" } });
    const container = await Container.create([], { overrides: new Map([[Platform, platform]]) });
    const onBarcode = vi.fn();
    renderToString(
      <ContainerProvider container={container}>
        <ScannerView formats={["ean13", "qr"]} onBarcode={onBarcode} />
      </ContainerProvider>,
    );
    platform.scanner.emit("6281000000012");
    expect(onBarcode).toHaveBeenCalledWith("6281000000012");
  });
});
