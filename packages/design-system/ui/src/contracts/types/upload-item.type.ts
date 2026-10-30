/**
 * Stackra file contract:
 * Purpose: `UploadItem`, one file an UploadList shows: its id, name, size, state, progress, error and preview image.
 * Boundary: types only; the caller owns the upload and passes the current state of each file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); design-system gap inventory row 6.
 */
import type { UploadStatus } from "#contracts/enums/upload-status.enum";

/** One file in an UploadList. */
export interface UploadItem {
  /** A stable id, handed back to `onRetry` and `onRemove`. */
  readonly id: string;
  /** The file name, shown as given (never translated). */
  readonly name: string;
  /** The size in bytes, shown in the locale's digits and unit. */
  readonly size?: number | undefined;
  /** The state of the upload. */
  readonly status: UploadStatus;
  /** How far along an `uploading` file is, 0 to 100; without it the ring spins. */
  readonly progress?: number | undefined;
  /** Why an `error` file failed, shown under its name; defaults to the generic failure text. */
  readonly error?: string | undefined;
  /** An image of the file (a local object or file URL), drawn as its thumbnail and its native long-press preview. */
  readonly previewSrc?: string | undefined;
}
