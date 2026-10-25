/**
 * Stackra file contract:
 * Purpose: unit tests of the `stackra` binary module: it runs the process's arguments through `runCli` with
 *          `PROCESS_IO` and sets the exit code from the result.
 * Boundary: test only; `runCli` is replaced by a fake and the exit code is restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0083.
 */
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PROCESS_IO } from "#node/constants/process-io.constant";
import { runCli } from "#node/functions/run-cli.function";

vi.mock("#node/functions/run-cli.function", () => ({ runCli: vi.fn(async () => 4) }));

afterEach(() => {
  process.exitCode = undefined;
});

describe("stackra binary", () => {
  it("runs argv through runCli and exits with its code", async () => {
    await import("#node/stackra");
    expect(runCli).toHaveBeenCalledWith(process.argv.slice(2), PROCESS_IO);
    expect(process.exitCode).toBe(4);
  });
});
