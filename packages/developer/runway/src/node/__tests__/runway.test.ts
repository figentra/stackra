/**
 * Stackra file contract:
 * Purpose: unit tests of the `runway` binary module: it runs `runRunway` in the repository root with the process
 *          arguments, prints what it logs, and prints `runway: <reason>` and exits 1 on an error.
 * Boundary: test only; `repositoryRoot` and `runRunway` are fakes, so no git or gh runs; the streams are spied and the
 *           exit code is restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0170; STA-268.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

// Hoisted so every re-import after `vi.resetModules` sees the same fakes.
const { repositoryRoot, runRunway } = vi.hoisted(() => ({
  repositoryRoot: vi.fn(() => "/work/acme"),
  runRunway: vi.fn(),
}));

vi.mock("#node/functions/repository-root.function", () => ({ repositoryRoot }));
vi.mock("#node/functions/run-runway.function", () => ({ runRunway }));

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

describe("runway binary", () => {
  it("runs the command in the repository root and prints each line it logs", async () => {
    runRunway.mockImplementationOnce((_argv, io: { root: string; log: (line: string) => void }) =>
      io.log(`root ${io.root}`),
    );
    await import("#node/runway");
    expect(runRunway).toHaveBeenCalledWith(process.argv.slice(2), expect.anything());
    expect(out).toBe("root /work/acme\n");
    expect(process.exitCode).toBeUndefined();
  });

  it("prints the reason and exits 1 on an error", async () => {
    runRunway.mockImplementationOnce(() => {
      throw new Error("usage: pnpm runway plan [env]");
    });
    await import("#node/runway");
    expect(err).toBe("runway: usage: pnpm runway plan [env]\n");
    expect(process.exitCode).toBe(1);
  });
});
