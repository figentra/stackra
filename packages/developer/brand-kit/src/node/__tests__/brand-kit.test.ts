/**
 * Stackra file contract:
 * Purpose: unit tests of the `stackra-brand-kit` binary module: it runs the parsed arguments through `runBrandKit`,
 *          prints each issue and the summary, and exits 1 on a failed check or an invalid kit.
 * Boundary: test only; `parseBrandKitArgs` and `runBrandKit` are fakes, the streams are spied and the exit code is
 *           restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (as amended).
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { InvalidBrandKitError } from "#core/errors/invalid-brand-kit.error";

// Hoisted so every re-import after `vi.resetModules` sees the same fakes.
const { parseBrandKitArgs, runBrandKit } = vi.hoisted(() => ({
  parseBrandKitArgs: vi.fn(() => ({ check: true })),
  runBrandKit: vi.fn(),
}));

vi.mock("#core/functions/parse-brand-kit-args.function", () => ({ parseBrandKitArgs }));
vi.mock("#core/functions/run-brand-kit.function", () => ({ runBrandKit }));

const MANIFEST = { kit: "acme", inputHash: "0", files: [] };

let out = "";
let err = "";

beforeEach(() => {
  out = "";
  err = "";
  vi.resetModules();
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    out += String(chunk);
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    err += String(chunk);
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("stackra-brand-kit binary", () => {
  it("prints the summary and exits 0 on a clean run", async () => {
    runBrandKit.mockResolvedValueOnce({ ok: true, issues: [], manifest: MANIFEST });
    await import("#node/brand-kit");
    expect(parseBrandKitArgs).toHaveBeenCalledWith(process.argv.slice(2));
    expect(runBrandKit).toHaveBeenCalledWith({ check: true });
    expect(out).toBe("ok: 0 files, kit acme\n");
    expect(process.exitCode).toBe(0);
  });

  it("prints each issue and exits 1 when the check fails", async () => {
    runBrandKit.mockResolvedValueOnce({
      ok: false,
      issues: [{ code: "drift", path: "icons/a.png", message: "changed" }],
      manifest: MANIFEST,
    });
    await import("#node/brand-kit");
    expect(err).toBe("drift icons/a.png: changed\n");
    expect(out).toBe("failed: 0 files, kit acme\n");
    expect(process.exitCode).toBe(1);
  });

  it("prints each problem of an invalid kit and exits 1", async () => {
    runBrandKit.mockRejectedValueOnce(new InvalidBrandKitError(["id: bad", "name: missing"]));
    await import("#node/brand-kit");
    expect(err).toBe("id: bad\nname: missing\n");
    expect(process.exitCode).toBe(1);
  });

  it("prints any other error and exits 1", async () => {
    runBrandKit.mockRejectedValueOnce(new Error("boom"));
    await import("#node/brand-kit");
    expect(err).toBe("Error: boom\n");
    expect(process.exitCode).toBe(1);
  });
});
