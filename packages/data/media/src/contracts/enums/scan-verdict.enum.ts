/**
 * Stackra file contract:
 * Purpose: `ScanVerdict`, what a `FileScanner` says of a stored file: clean, infected, not scanned yet, or not
 *          scannable.
 * Boundary: an `Enum.of` value plus the type of the same name; the code is what a file record stores. What the files
 *           service does with each verdict (quarantine, retry, block the download) is its own policy.
 * Runtime: isomorphic
 * Governing contract: ADR 0222 (files: scanning); ADR 0354 (malware scanning on both clouds); OS-142.
 */
import { Enum } from "@stackra/contracts";

/** A scan's outcome. */
export const ScanVerdict = Enum.of({
  /** No threat found. */
  Clean: "clean",
  /** A threat was found; `threats` names it. */
  Infected: "infected",
  /** The scan has not finished (an asynchronous scanner such as GuardDuty); ask again later. */
  Pending: "pending",
  /** The scanner could not scan the file (too large, unsupported, access denied). */
  Failed: "failed",
});

/** One of the codes above. */
export type ScanVerdict = Enum.Value<typeof ScanVerdict>;
