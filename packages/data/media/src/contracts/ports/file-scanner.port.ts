/**
 * Stackra file contract:
 * Purpose: the `FileScanner` port: the malware scan of a stored upload before the files service hands it out. Config
 *          `media.scanner` picks the driver: `guard_duty` where AWS GuardDuty malware protection runs in the region,
 *          `clamav` where it does not (GCP Dammam, a local stack), `memory` in tests.
 * Boundary: an abstract class that is its own token, keyed `media.FileScanner`. `path` is the `MediaDisk` path of the
 *           object; `read` gives its bytes, which only a scanner that receives the bytes calls (GuardDuty scans the
 *           object in place). A scanner that cannot decide answers `failed`, never throws for the file's sake; it
 *           throws only when it cannot be reached. Which environment runs which scanner is runway's value.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files: scanning); ADR 0354 (a driver for both clouds, ClamAV where GuardDuty is not
 *                     offered); ADR 0294 (decisions 4 and 16); OS-142.
 */
import { Port } from "@stackra/contracts";

import type { ScanResult } from "#contracts/types/scan-result.type";

/**
 * Scans one stored file.
 *
 * @example
 * const result = await scanner.scan(path, () => files.read(path));
 * if (result.verdict === ScanVerdict.Infected) await quarantine(path, result.threats);
 */
export abstract class FileScanner extends Port {
  /** Type-only port key, so `DriverName<FileScanner>` narrows to this port's drivers. */
  declare readonly "~key": "media.FileScanner";

  /**
   * The verdict on the object at `path`.
   *
   * @param path - the object's `MediaDisk` path.
   * @param read - its bytes, read only by a scanner that needs them.
   * @throws Error when the scanner cannot be reached.
   */
  abstract scan(path: string, read: () => Promise<Uint8Array>): Promise<ScanResult>;
}
