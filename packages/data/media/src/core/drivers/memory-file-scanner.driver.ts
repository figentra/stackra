/**
 * Stackra file contract:
 * Purpose: `MemoryFileScannerDriver`, the `memory` driver of `FileScanner`: finds the EICAR anti-malware test file and
 *          calls everything else clean, so tests and a local stack exercise the infected path without a real scanner.
 * Boundary: it detects nothing but the standard EICAR test string, so it is never the scanner of a deployed
 *           environment: `MediaConfig` refuses `media.scanner: memory` at boot when the running environment (the one
 *           reader of @stackra/config, from `STACKRA_ENVIRONMENT` in the runtime) is `preview`, `staging` or
 *           `production` (STA-669).
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first; decision 2: never in a deployment); ADR 0222; STA-2844; STA-669.
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
