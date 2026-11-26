/**
 * Stackra file contract:
 * Purpose: `FreeAndProFinding`, one reason the "Free and Pro" customer page is wrong about a package.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0461; STA-2865.
 */

/** A finding on the "Free and Pro" page. */
export interface FreeAndProFinding {
  /** The 1-based line, or undefined when the finding is about something the page leaves out. */
  readonly line: number | undefined;
  /** What is wrong, for the reader of the check's output. */
  readonly reason: string;
}
