/**
 * Stackra file contract:
 * Purpose: `CHANGE_CONSUMERS`, the watched models of this process, by class name: the model class, so the writer
 *          records only that class's rows, and the change consumer classes the relay hands each committed change to.
 * Boundary: process-wide and internal: written by `registerChangeConsumers`, read by the writer and the relay. A model
 *           with no entry is not watched, so its flushes write no change message.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 5: indexing through the outbox).
 */
import type { AnyClass } from "@stackra/container";

import type { ChangeConsumer } from "#contracts/index";

/** One watched model and its consumers, in registration order. */
interface Watch {
  readonly model: AnyClass;
  readonly consumers: AnyClass<ChangeConsumer>[];
}

/** Model class name to its watch. */
export const CHANGE_CONSUMERS = new Map<string, Watch>();
