/**
 * Stackra file contract:
 * Purpose: an R2 object with its body, as the cache reads it from `get`.
 * Boundary: a type only.
 * Runtime: worker
 * Governing contract: ADR 0026 (decision 1: artifacts in R2).
 */
import type { TurboCacheObject } from "./turbo-cache-object.interface";

/** An R2 object with its body, as `get` answers it. */
export interface TurboCacheObjectBody extends TurboCacheObject {
  /** The artifact bytes. */
  readonly body: ReadableStream;
}
