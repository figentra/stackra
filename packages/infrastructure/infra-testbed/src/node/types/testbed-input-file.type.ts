/**
 * Stackra file contract:
 * Purpose: `TestbedInputFile`, one file the program uploads: the S3 key under `build/` and where it is read from.
 * Boundary: a type only.
 * Runtime: node
 * Governing contract: ADR 0484 (decision 2).
 */

export type TestbedInputFile = { readonly key: string; readonly path: string };
