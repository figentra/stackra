/**
 * Stackra file contract:
 * Purpose: unit tests of `MobileOnboardCommand` on the console: the flags reach `runMobileOnboard`, every step is a
 *          checklist row (its state and the owner's steps kept for `--json`), the owner's steps and the written files
 *          are printed, and it exits 3 while a step is manual or blocked, 0 when every step is done or planned, and 2
 *          for a usage error.
 * Boundary: test only; `runMobileOnboard` is mocked, so no runway is read and no store is called.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482; spec sta-1623; STA-1966.
 */
import type { MobileOnboard } from "@stackra/runway/node";
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MobileOnboardCommand } from "#node/commands/mobile-onboard.command";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { runMobileOnboard } from "#node/product/functions/run-mobile-onboard.function";

vi.mock("#node/product/functions/run-mobile-onboard.function", () => ({
  runMobileOnboard: vi.fn(),
}));

const ONBOARD: MobileOnboard = {
  app: "academorix",
  ids: { bundleId: "app.academorix.mobile", packageName: "app.academorix.mobile" },
  steps: [
    { key: "identity", state: "done", detail: "ids from the runway" },
    { key: "eas-project", state: "planned", detail: "would create academorix/academorix" },
    {
      key: "apple-app-record",
      state: "manual",
      detail: "the owner creates the record",
      manual: ["App Store Connect › Apps › + › New App"],
    },
  ],
  written: [],
};

beforeEach(() => {
  vi.mocked(runMobileOnboard).mockReset();
});

describe("MobileOnboardCommand", () => {
  it("draws each step and the owner's steps, and exits 3 while one is manual", async () => {
    vi.mocked(runMobileOnboard).mockResolvedValue(ONBOARD);
    const result = await runCommandForTest(
      [MobileOnboardCommand],
      ["mobile", "onboard", "--app", "academorix"],
    );
    expect(result.exitCode).toBe(3);
    expect(runMobileOnboard).toHaveBeenCalledWith("/work", {
      app: "academorix",
      check: false,
      live: false,
    });
    expect(result.stdout).toContain(
      "mobile onboard academorix (offline plan: nothing is called or written)",
    );
    expect(result.stdout).toContain("eas-project");
    expect(result.stdout).toContain("App Store Connect › Apps › + › New App");
    expect(result.stdout).not.toContain("wrote ");
  });

  it("keeps each step's state and manual steps in the --json rows, and exits 0 when none is manual", async () => {
    vi.mocked(runMobileOnboard).mockResolvedValue({
      ...ONBOARD,
      steps: ONBOARD.steps.slice(0, 2),
      written: ["runway.yaml"],
    });
    const result = await runCommandForTest([MobileOnboardCommand], ["mobile:onboard", "--json"]);
    expect(result.exitCode).toBe(0);
    expect((result.json as { data: unknown }).data).toEqual([
      { name: "identity", status: "ok", detail: "ids from the runway", state: "done" },
      {
        name: "eas-project",
        status: "info",
        detail: "would create academorix/academorix",
        state: "planned",
      },
    ]);
  });

  it("exits 2 for a usage error", async () => {
    vi.mocked(runMobileOnboard).mockRejectedValue(new CliUsageError("pass --check or --live"));
    const result = await runCommandForTest(
      [MobileOnboardCommand],
      ["mobile:onboard", "--check", "--live"],
    );
    expect(result.exitCode).toBe(2);
  });
});
