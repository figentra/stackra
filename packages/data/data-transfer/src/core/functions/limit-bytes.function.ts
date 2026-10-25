/**
 * Stackra file contract:
 * Purpose: `limitBytes`, a byte source that refuses once it has passed `max` bytes.
 * Boundary: internal to the readers; it counts while streaming and never buffers.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 4).
 */
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { TransferLimitExceededError } from "#core/errors/transfer-limit-exceeded.error";

/**
 * `source`, refused past `max` bytes.
 *
 * @yields The chunks of `source`, unchanged.
 * @throws TransferLimitExceededError on the chunk that passes `max`.
 */
export async function* limitBytes(source: TabularSource, max: number): AsyncGenerator<Uint8Array> {
  let total = 0;
  for await (const chunk of source) {
    total += chunk.length;
    if (total > max) throw TransferLimitExceededError.create({ limit: "bytes", max });
    yield chunk;
  }
}
