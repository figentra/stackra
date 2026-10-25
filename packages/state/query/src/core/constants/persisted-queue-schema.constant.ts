/**
 * Stackra file contract:
 * Purpose: `PERSISTED_QUEUE_SCHEMA`, the stored form of one partition's offline queue in the `outbox` area: a schema
 *          version, the pending calls in order and the conflict records.
 * Boundary: internal; the queue checks what it reads back with it, because the outbox outlives app versions. The
 *           envelope is versioned so a later shape adds an upgrader instead of dropping queued work (plan row "client
 *           migrations": the queue is the one store with a client migration). Version 2 adds each call's device and
 *           sequence (ADR 0338 decision 1); a version 1 queue still parses, and `MutationQueue.open` upgrades it.
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decision 2); ADR 0252 (decision 2: survival across an upgrade); ADR 0338 (decision 1).
 */
import { json } from "@stackra/validation";
import { z } from "zod";

/** One stored pending call of version 1. */
const MUTATION_V1 = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  input: json(),
  aggregate: z.string(),
  queuedAt: z.string(),
  expiresAt: z.string(),
});

/** One stored pending call of version 2: its device and its sequence once sent. */
const MUTATION_V2 = MUTATION_V1.extend({
  deviceId: z.string().min(1),
  sequence: z.number().int().positive().nullable(),
});

/** What a conflict record adds to its call. */
const CONFLICT = { code: z.string().min(1), server: json(), conflictedAt: z.string() };

/** The stored queue of one partition, in either version. */
export const PERSISTED_QUEUE_SCHEMA = z.discriminatedUnion("version", [
  z.object({
    version: z.literal(1),
    items: z.array(MUTATION_V1),
    conflicts: z.array(MUTATION_V1.extend(CONFLICT)),
  }),
  z.object({
    version: z.literal(2),
    items: z.array(MUTATION_V2),
    conflicts: z.array(MUTATION_V2.extend(CONFLICT)),
  }),
]);
