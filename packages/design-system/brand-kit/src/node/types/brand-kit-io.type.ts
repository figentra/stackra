/**
 * Stackra file contract:
 * Purpose: `BrandKitIo`, where a `brand-kit` run writes: its normal output and its errors.
 * Boundary: type only. The binary passes this process's streams; a test passes collectors.
 * Runtime: node
 * Governing contract: ADR 0441 (decision 5: the CLI Runway runs).
 */

/** The output streams of one run. */
export type BrandKitIo = {
  /** Writes normal output. */
  readonly out: (text: string) => void;

  /** Writes errors and diagnostics. */
  readonly err: (text: string) => void;
};
