/**
 * Stackra file contract:
 * Purpose: unit tests of `SmokeCommand` on the console: the flags reach `runSmoke` by their long names, each result
 *          is a checklist row under its target (the `--json` data), a failed subject exits 1 with the failure, and a
 *          usage error from `runSmoke` exits 2.
 * Boundary: test only; `runSmoke` is mocked, so no browser, simulator or emulator runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); STA-265 spec (FR-013); STA-1966.
 */
import { runCommandForTest } from "@stackra/console/testing";
import { beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SmokeCommand } from "#node/commands/smoke.command";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { runSmoke } from "#node/product/functions/run-smoke.function";

vi.mock("#node/product/functions/run-smoke.function", () => ({ runSmoke: vi.fn() }));

const passed = {
  target: "web" as const,
  name: "console",
  passed: true,
  problems: [],
  evidence: ".stackra/smoke/console.png",
};

beforeEach(() => {
  vi.mocked(runSmoke).mockReset();
});

describe("SmokeCommand", () => {
  it("passes the flags to runSmoke and emits one row per result", async () => {
    vi.mocked(runSmoke).mockResolvedValue({ results: [passed] });
    const result = await runCommandForTest(
      [SmokeCommand],
      [
        "smoke",
        "--env",
        "preview",
        "--only",
        "mobile",
        "--app",
        "staff",
        "--ios",
        "build/Staff.app",
        "--template-dir",
        "line",
        "--json",
      ],
    );
    expect(result.exitCode).toBe(0);
    expect(runSmoke).toHaveBeenCalledWith("/work", {
      env: "preview",
      only: "mobile",
      app: "staff",
      ios: "build/Staff.app",
      android: undefined,
      "template-dir": "line",
    });
    expect((result.json as { data: unknown }).data).toEqual([
      { name: "console", status: "ok", group: "web", detail: ".stackra/smoke/console.png" },
    ]);
  });

  it("exits 1 with the failure when a subject failed", async () => {
    vi.mocked(runSmoke).mockResolvedValue({
      results: [{ ...passed, passed: false, problems: ["page error: boom"] }],
      failure: "Smoke failed: web console",
    });
    const result = await runCommandForTest([SmokeCommand], ["smoke", "--env", "preview"]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout + result.stderr).toContain("page error: boom");
    expect(result.stderr).toContain("Smoke failed: web console");
  });

  it("exits 2 when runSmoke refuses the flags", async () => {
    vi.mocked(runSmoke).mockRejectedValue(new CliUsageError("name the environment"));
    expect((await runCommandForTest([SmokeCommand], ["smoke"])).exitCode).toBe(2);
  });
});
