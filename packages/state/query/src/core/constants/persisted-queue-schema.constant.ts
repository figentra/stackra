/**
 * Stackra file contract:
 * Purpose: `PERSISTED_QUEUE_SCHEMA`, the stored form of one partition's offline queue in the `outbox` area: a schema
 *          version, the pending calls in order and the conflict records.
 * Boundary: internal; the queue checks what it reads back with it, because the outbox outlives app versions. The
 *           envelope is versioned (`version: 1`) so a later shape adds an upgrader instead of dropping queued work
 *           (plan row "client migrations": the queue is the one store with a client migration).
 * Runtime: isomorphic
 * Governing contract: ADR 0059 (decision 2); ADR 0252 (decision 2: survival across an upgrade).
 */
import { json } from "@stackra/validation";
import { z } from "zod";

/** One stored pending call. */
const PERSISTED_MUTATION = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  input: json(),
  aggregate: z.string(),
  queuedAt: z.string(),
  expiresAt: z.string(),
});

/** The stored queue of one partition. */
export const PERSISTED_QUEUE_SCHEMA = z.object({
  version: z.literal(1),
  items: z.array(PERSISTED_MUTATION),
  conflicts: z.array(
    PERSISTED_MUTATION.extend({
      code: z.string().min(1),
      server: json(),
      conflictedAt: z.string(),
    }),
  ),
});
