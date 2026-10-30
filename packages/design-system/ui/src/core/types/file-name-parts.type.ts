/**
 * Stackra file contract:
 * Purpose: `FileNameParts`, a file name cut into its base and its extension, with the direction the base reads in.
 * Boundary: types only; `fileNamePartsOf` makes it, the web `FileName` and `isolatedFileNameOf` draw it.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (right-to-left); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */

/** A file name in parts. */
export interface FileNameParts {
  /** The name before the extension, for example "فاتورة-1042"; the whole name when there is no extension. */
  readonly base: string;
  /** The extension with its dot, for example ".pdf"; empty when the name has none. */
  readonly extension: string;
  /** The direction of the base's first letter: `rtl` for Arabic or Hebrew script, else `ltr`. */
  readonly direction: "ltr" | "rtl";
}
