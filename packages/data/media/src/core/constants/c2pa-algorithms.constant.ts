/**
 * Stackra file contract:
 * Purpose: `C2PA_ALGORITHMS`, the signing algorithms a C2PA claim signature may use (C2PA 2.x, section "Digital
 *          signatures"): the values of `media.c2pa.algorithm`.
 * Boundary: data only; the shipped schema's enum and `MediaOptions`' field type are both read from it. Which one a
 *           host uses follows from its certificate's key, never code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); COM-73, COM-294; STA-789.
 */

/** The C2PA signing algorithms, by their c2pa-rs names. */
export const C2PA_ALGORITHMS = [
  "es256",
  "es384",
  "es512",
  "ps256",
  "ps384",
  "ps512",
  "ed25519",
] as const;
