/**
 * Stackra file contract:
 * Purpose: `FileBlockedError`, what `MediaLibrary.temporaryUrl` raises for a stored file the malware scanner did not
 *          clear: a threat was found (`malware`) or the scanner could not scan it (`unscannable`). A file recorded
 *          before scanning existed is scanned on its first link and refused this way when it is not clean.
 * Boundary: kind `FailedPrecondition`, code `file_blocked`; the one detail is the reason, never the threat name, the
 *           path or the file. The file is left where it is: what to do with it (quarantine, delete, tell someone) is
 *           the owning service's policy.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0294 (decisions 16 and 20); ADR 0222 (the consequence "an
 *                     unscanned file is never served").
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** Not retryable: the scanner's verdict on the same bytes does not change. */
export class FileBlockedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** Why the file is not served: a threat was found, or the scanner could not scan it. */
  reason!: "malware" | "unscannable";
}
