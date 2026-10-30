/**
 * Stackra file contract:
 * Purpose: the states of one file in an UploadList: `queued` (waiting its turn), `uploading` (with a progress ring),
 *          `done` (a check) and `error` (a retry button).
 * Boundary: the values only; the caller owns the upload and reports each file's state.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory row 6 (owner choice, 2026-10-28).
 */

/** The upload states. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the states carry no labels.
export const UploadStatus = Object.freeze(["queued", "uploading", "done", "error"] as const);

/** One upload state. */
export type UploadStatus = (typeof UploadStatus)[number];
