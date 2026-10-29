/**
 * Stackra file contract:
 * Purpose: proves `ExternalCustomerDisplayDriver` refuses with capability `window` without the native module or a
 *          connected display (and when the module fails), and hands each view to the module as JSON when one is
 *          connected.
 * Boundary: test only; the Expo modules registry is a stand-in on `globalThis.expo`, removed after each test.
 * Runtime: node
 * Governing contract: ADR 0430 (decision 1); ADR 0478 (decision 5); ADR 0022 (test placement).
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ExternalCustomerDisplayDriver } from "#core/drivers/external-customer-display.driver";

const REFUSED = { ok: false, error: { code: "unavailable", capability: "window" } };

/** Installs a stand-in module; `isAvailable` answers `connected`. */
function installModule(connected: boolean) {
  const module = {
    isAvailable: vi.fn(async () => connected),
    show: vi.fn(async (_view: string) => undefined),
    clear: vi.fn(async () => undefined),
  };
  (globalThis as { expo?: unknown }).expo = { modules: { StackraCustomerDisplay: module } };
  return module;
}

describe("ExternalCustomerDisplayDriver", () => {
  afterEach(() => {
    delete (globalThis as { expo?: unknown }).expo;
  });

  it("refuses without the native module", async () => {
    expect(await new ExternalCustomerDisplayDriver().probe()).toEqual(REFUSED);
  });

  it("refuses with no display connected, or when the module fails", async () => {
    installModule(false);
    expect(
      await new ExternalCustomerDisplayDriver().show({ lines: [], total: null, message: null }),
    ).toEqual(REFUSED);
    const module = installModule(true);
    module.clear.mockRejectedValueOnce(new Error("detached"));
    expect(await new ExternalCustomerDisplayDriver().clear()).toEqual(REFUSED);
  });

  it("hands the view to the module as JSON", async () => {
    const module = installModule(true);
    const view = {
      lines: [{ label: "Latte", amount: "SAR 18.00" }],
      total: "SAR 18.00",
      message: null,
    };
    expect(await new ExternalCustomerDisplayDriver().show(view)).toEqual({
      ok: true,
      data: undefined,
    });
    expect(module.show).toHaveBeenCalledWith(JSON.stringify(view));
  });
});
