/**
 * Stackra file contract:
 * Purpose: `BytesValueContractProps`, the props of every runtime's `BytesValue`: a size in bytes written in the
 *          largest unit that keeps it at or above one (kB, MB, GB, …), in the locale's unit words and digits.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0192; STA-1371 (wave A).
 */

/** Props shared by the web and native `BytesValue`. */
export interface BytesValueContractProps {
  /** The size, in bytes. */
  readonly value: number;
  /** `decimal` steps by 1000 (the default, as storage is sold); `binary` by 1024 (as memory is). */
  readonly base?: "decimal" | "binary" | undefined;
  /** The most fraction digits; defaults to 1. */
  readonly fractionDigits?: number | undefined;
}
