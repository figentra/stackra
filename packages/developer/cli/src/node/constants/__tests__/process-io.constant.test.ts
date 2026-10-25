/**
 * Stackra file contract:
 * Purpose: unit tests of `PROCESS_IO`: tools inherit the terminal, and output and errors go to this process's
 *          standard output and standard error.
 * Boundary: test only; spies on the process streams and restores them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0083.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { PROCESS_IO } from "#node/constants/process-io.constant";

describe("PROCESS_IO", () => {
  it("lets tools inherit the terminal and writes to stdout and stderr", () => {
    expect(PROCESS_IO.inherit).toBe(true);
    const out = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const err = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    try {
      PROCESS_IO.out("o");
      PROCESS_IO.err("e");
      expect(out).toHaveBeenCalledWith("o");
      expect(err).toHaveBeenCalledWith("e");
    } finally {
      out.mockRestore();
      err.mockRestore();
    }
  });
});
