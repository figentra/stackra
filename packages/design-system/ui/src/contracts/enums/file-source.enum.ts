/**
 * Stackra file contract:
 * Purpose: the sources a FileTrigger opens: `files` (the file picker), `photos` (the photo library, images only) and
 *          `camera` (the camera, one new photo).
 * Boundary: the values only; each FileTrigger maps them to its platform's picker.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); design-system gap inventory row 6 (owner choice, 2026-10-28).
 */

/** The file sources. */
// shortcut: a frozen tuple until @stackra/contracts ships Enum.of (ADR 0128); the sources carry no labels.
export const FileSource = Object.freeze(["files", "photos", "camera"] as const);

/** One file source. */
export type FileSource = (typeof FileSource)[number];
