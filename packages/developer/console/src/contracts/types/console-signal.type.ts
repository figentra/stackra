/**
 * Stackra file contract:
 * Purpose: `ConsoleSignal`, the process signals that stop a running command.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012.
 */

/** A signal the kernel answers with exit code 130 (`SIGINT`) or 143 (`SIGTERM`). */
export type ConsoleSignal = "SIGINT" | "SIGTERM";
