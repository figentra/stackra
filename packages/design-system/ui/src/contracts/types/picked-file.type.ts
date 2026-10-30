/**
 * Stackra file contract:
 * Purpose: `PickedFile`, one file the native FileTrigger hands back: its local URI, name, size and MIME type.
 * Boundary: types only; the web FileTrigger hands back the browser's own `File` objects instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); design-system gap inventory row 6.
 */

/** One file a native picker returned. */
export interface PickedFile {
  /** The local URI to read or upload the file from. */
  readonly uri: string;
  /** The file name, or the last segment of the URI when the picker gives none. */
  readonly name: string;
  /** The size in bytes, when the picker knows it. */
  readonly size?: number | undefined;
  /** The MIME type, when the picker knows it. */
  readonly type?: string | undefined;
}
