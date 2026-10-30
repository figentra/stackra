/**
 * Stackra file contract:
 * Purpose: unit tests of `stackra dev --product`: it needs `--os` and something to run, runs gen first and stops on a
 *          failed gen, starts every surface except `ops` and every mobile app, and answers the first failing code.
 * Boundary: test only; `readRunway`, the surface runner and the mobile runner are mocked, nothing starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0436 (decisions 2, 6 and 9); ADR 0441 (decisions 2 and 3).
 */
import { beforeEach, describe, expect, it } from "@stackra/testing";
import type { RootRunway } from "@stackra/runway";
import { readRunway } from "@stackra/runway/node";
import { vi } from "vitest";

import { runDevMobile } from "#node/dev-mobile/functions/run-dev-mobile.function";
import { runDevProduct } from "#node/dev-product/functions/run-dev-product.function";
import { runDevSurface } from "#node/dev-surface/functions/run-dev-surface.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";
import type { CliContext } from "#node/types/cli-context.type";

vi.mock("@stackra/runway/node", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  readRunway: vi.fn(),
}));
vi.mock("#node/dev-surface/functions/run-dev-surface.function", () => ({ runDevSurface: vi.fn() }));
vi.mock("#node/dev-mobile/functions/run-dev-mobile.function", () => ({ runDevMobile: vi.fn() }));

const ROOT = {
  project: "acme",
  product: { key: "acme" },
  surfaces: { console: {}, landing: {}, ops: {} },
  mobile: { app: {} },
} as unknown as RootRunway;

const run = (values: CliContext["values"], gen = 0) => {
  const { io, output } = captureIo();
  const cli = vi.fn(async () => gen);
  const code = runDevProduct({ cwd: "/repo", io, values, positionals: [], rest: [], cli });
  return { code, output, cli };
};

beforeEach(() => {
  vi.mocked(readRunway).mockReset().mockReturnValue(ROOT);
  vi.mocked(runDevSurface).mockReset().mockResolvedValue(0);
  vi.mocked(runDevMobile).mockReset().mockResolvedValue(0);
});

describe("runDevProduct", () => {
  it("needs --os", async () => {
    await expect(run({ product: true }).code).rejects.toThrow(CliUsageError);
  });

  it("refuses a runway with nothing to run", async () => {
    vi.mocked(readRunway).mockReturnValue({
      project: "bare",
      surfaces: { ops: {} },
    } as unknown as RootRunway);
    await expect(run({ product: true, os: "../os" }).code).rejects.toThrow(
      "names no surfaces and no mobile apps",
    );
  });

  it("runs gen, then every surface but ops and every app", async () => {
    const { code, output, cli } = run({ product: true, os: "../os" });

    expect(await code).toBe(0);
    expect(output()).toContain("product acme: console, landing, mobile.app");
    expect(cli).toHaveBeenCalledWith(["gen"], expect.anything());
    expect(vi.mocked(runDevSurface).mock.calls.map((call) => call[1])).toEqual([
      "console",
      "landing",
    ]);
    expect(vi.mocked(runDevMobile).mock.calls.map((call) => call[1])).toEqual(["app"]);
  });

  it("stops when gen fails and answers the first failing run otherwise", async () => {
    expect(await run({ product: true, os: "../os" }, 2).code).toBe(1);
    expect(runDevSurface).not.toHaveBeenCalled();

    vi.mocked(runDevSurface).mockResolvedValueOnce(0).mockResolvedValueOnce(3);
    expect(await run({ product: true, os: "../os" }).code).toBe(3);
  });
});
