/**
 * Stackra file contract:
 * Purpose: `PERSISTED_CACHE_SCHEMA`, the stored form of one partition's query cache in the `cache` area: the buster it
 *          was written under, when, and TanStack Query's dehydrated state.
 * Boundary: internal; the cache checks what it reads back with it and drops anything else, because the cache is
 *           disposable (a refetch rebuilds it). The buster is the host's client manifest hash, so a shape change drops
 *           the old cache instead of feeding old shapes to new code.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decision 1); ADR 0079 (decision 1: TanStack Query through this package).
 */
import type { DehydratedState } from "@tanstack/query-core";
import { z } from "zod";

/** Whether `value` looks like a dehydrated state: an object with query and mutation lists. */
const isDehydrated = (value: unknown): value is DehydratedState =>
  typeof value === "object" &&
  value !== null &&
  Array.isArray((value as { queries?: unknown }).queries) &&
  Array.isArray((value as { mutations?: unknown }).mutations);

/** The stored cache of one partition. */
export const PERSISTED_CACHE_SCHEMA = z.object({
  buster: z.string(),
  savedAt: z.string(),
  state: z.custom<DehydratedState>(isDehydrated),
});
