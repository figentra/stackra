/**
 * Stackra file contract:
 * Purpose: `FileNotFoundError`, what a `FileSystem` driver throws when `read` or `stat` finds nothing under a key.
 * Boundary: a `NotFound` refusal (`.error.ts` takes `Refusal`). A disk sits below the action pipeline, so the caller
 *           still decides whether a missing file reaches its own caller. Its one detail is the normalised key, never
 *           the disk's root or bucket; its message is its code, `file_not_found`.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 7); ADR 0231 (error classes end in `Error`); ADR 0294 (R3: `.error.ts` takes
 *                     `Refusal`); STA-344.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Nothing is stored under a key.
 *
 * @example
 * if (file === undefined) throw FileNotFoundError.create({ path: key });
 */
export class FileNotFoundError extends Refusal({ kind: ErrorKind.NotFound }) {
  /** The normalised key that was asked for. */
  path!: string;
}
