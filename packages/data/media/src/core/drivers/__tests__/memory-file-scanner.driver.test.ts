/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryFileScannerDriver`: the EICAR test file is infected, anything else is clean.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266.
 */
import { describe, expect, it } from "@stackra/testing";

import { FileScanner } from "#contracts/ports/file-scanner.port";
import { MemoryFileScannerDriver } from "#core/drivers/memory-file-scanner.driver";

/** The EICAR test file. */
const EICAR = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

describe("MemoryFileScannerDriver", () => {
  it("finds the EICAR test file and passes everything else", async () => {
    const scanner = new MemoryFileScannerDriver();
    expect(scanner).toBeInstanceOf(FileScanner);
    expect(await scanner.scan("uploads/a", async () => new TextEncoder().encode(EICAR))).toEqual({
      verdict: "infected",
      threats: ["Eicar-Test-Signature"],
    });
    expect(await scanner.scan("uploads/b", async () => new Uint8Array([1, 2, 3]))).toEqual({
      verdict: "clean",
      threats: [],
    });
  });
});
