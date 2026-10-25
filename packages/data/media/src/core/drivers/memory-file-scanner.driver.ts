/**
 * Stackra file contract:
 * Purpose: `MemoryFileScannerDriver`, the `memory` driver of `FileScanner`: finds the EICAR anti-malware test file and
 *          calls everything else clean, so tests and a local stack exercise the infected path without a real scanner.
 * Boundary: it detects nothing but the standard EICAR test string; never the scanner of a deployed environment
 *           (runway sets `media.scanner` there).
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0222.
 */
import { Driver } from "@stackra/container";

import { ScanVerdict } from "#contracts/enums/scan-verdict.enum";
import { FileScanner } from "#contracts/ports/file-scanner.port";
import type { ScanResult } from "#contracts/types/scan-result.type";

/** The EICAR test file's signature. */
const EICAR = "EICAR-STANDARD-ANTIVIRUS-TEST-FILE";

/**
 * Finds the EICAR test file.
 *
 * @example
 * const result = await new MemoryFileScannerDriver().scan("uploads/upl_1", async () => bytes);
 */
export class MemoryFileScannerDriver extends Driver(FileScanner) {
  /** `infected` when the bytes hold the EICAR signature, else `clean`. */
  async scan(_path: string, read: () => Promise<Uint8Array>): Promise<ScanResult> {
    const text = new TextDecoder("latin1").decode(await read());
    return text.includes(EICAR)
      ? { verdict: ScanVerdict.Infected, threats: ["Eicar-Test-Signature"] }
      : { verdict: ScanVerdict.Clean, threats: [] };
  }
}
