/**
 * Stackra file contract:
 * Purpose: the part of Cloudflare's R2 bucket binding the cache uses (head, get, put), typed structurally so the
 *          member needs no Workers type package and the tests can pass an in-memory stand-in.
 * Boundary: a type only; the runtime hands the real binding in as `env.BUCKET`.
 * Runtime: worker
 * Governing contract: ADR 0026 (decision 1: artifacts in R2).
 */
import type { TurboCacheObjectBody } from "./turbo-cache-object-body.interface";
import type { TurboCacheObject } from "./turbo-cache-object.interface";

/** The R2 bucket binding. */
export interface TurboCacheBucket {
  /** Reads an artifact's metadata without its body, for the HEAD and query routes; `null` when absent. */
  head: (key: string) => Promise<TurboCacheObject | null>;
  /** Reads an artifact's metadata and body stream, for the GET route; `null` when absent. */
  get: (key: string) => Promise<TurboCacheObjectBody | null>;
  /** Stores an uploaded artifact body under `key`, with turbo's tag and duration as custom metadata. */
  put: (
    key: string,
    value: ReadableStream,
    options: { readonly customMetadata: Record<string, string> },
  ) => Promise<unknown>;
}
