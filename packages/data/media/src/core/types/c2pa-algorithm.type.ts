/**
 * Stackra file contract:
 * Purpose: `C2paAlgorithm`, one C2PA signing algorithm (`es256`, `ps256`, ...): the type of `media.c2pa.algorithm`.
 * Boundary: a type only, read from `C2PA_ALGORITHMS`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); COM-73, COM-294; STA-789.
 */
import type { C2PA_ALGORITHMS } from "#core/constants/c2pa-algorithms.constant";

/** One C2PA signing algorithm. */
export type C2paAlgorithm = (typeof C2PA_ALGORITHMS)[number];
