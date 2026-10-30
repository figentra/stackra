/**
 * Stackra file contract:
 * Purpose: `FileNameProps`, the props of the web `FileName` in `file-name.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0060; STA-1371 (wave C).
 */

/** Props of the web FileName. */
export interface FileNameProps {
  /** The file name as stored, for example "فاتورة-1042.pdf". */
  readonly name: string;
  /** Styles the root. */
  readonly className?: string | undefined;
}
