/**
 * Stackra file contract:
 * Purpose: unit tests of `launchDesktop`: Electron is launched on the member's desktop main bundle with the e2e flag and the declared fakes in
 *          its environment (the inherited environment kept), and the app it returns can open a deep link by emitting `open-url`.
 * Boundary: test only; Playwright's `_electron.launch` and the project's testDir are stubs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { launchDesktop } from "#e2e/launch-desktop/launch-desktop.function";

const { info, launch, evaluate } = vi.hoisted(() => ({
  info: vi.fn(),
  launch: vi.fn(),
  evaluate: vi.fn(),
}));
vi.mock("@playwright/test", () => ({ test: { info }, _electron: { launch } }));

afterEach(() => {
  vi.unstubAllEnvs();
  launch.mockReset();
  evaluate.mockReset();
});

describe("launchDesktop", () => {
  it("launches the desktop main bundle under the member root with the e2e flag and the fakes", async () => {
    info.mockReturnValue({ project: { testDir: "/repo/apps/desktop" } });
    vi.stubEnv("PATH_MARKER", "kept");
    launch.mockResolvedValue({ evaluate });
    await launchDesktop({ fakes: { "peripherals.receipt.print": { printer: "fake-escpos" } } });
    const options = launch.mock.calls[0]?.[0] as {
      args: string[];
      cwd: string;
      env: Record<string, string>;
    };
    expect(options.args).toEqual(["/repo/apps/desktop/dist/desktop/main.js"]);
    expect(options.cwd).toBe("/repo/apps/desktop");
    expect(options.env["STACKRA_E2E"]).toBe("1");
    expect(JSON.parse(options.env["STACKRA_E2E_FAKES"] ?? "")).toEqual({
      "peripherals.receipt.print": { printer: "fake-escpos" },
    });
    expect(options.env["PATH_MARKER"]).toBe("kept");
  });

  it("declares no fakes by default", async () => {
    info.mockReturnValue({ project: { testDir: "/repo/apps/desktop" } });
    launch.mockResolvedValue({ evaluate });
    await launchDesktop();
    const options = launch.mock.calls[0]?.[0] as { env: Record<string, string> };
    expect(options.env["STACKRA_E2E_FAKES"]).toBe("{}");
  });

  it("returns the app with openUrl, which emits open-url inside the main process", async () => {
    info.mockReturnValue({ project: { testDir: "/repo/apps/desktop" } });
    launch.mockResolvedValue({ evaluate });
    const app = await launchDesktop();
    await app.openUrl("stackra://orders/1");
    const [run, link] = evaluate.mock.calls[0] as [
      (electron: { app: { emit: (...args: unknown[]) => void } }, link: string) => void,
      string,
    ];
    expect(link).toBe("stackra://orders/1");
    const emit = vi.fn();
    run({ app: { emit } }, link);
    expect(emit).toHaveBeenCalledWith("open-url", { preventDefault: expect.any(Function) }, link);
  });
});
