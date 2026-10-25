/**
 * Stackra file contract:
 * Purpose: `decodeMessage(text)`, how a client transport reads one frame from the wire into a `RealtimeMessage`.
 * Boundary: the client's trust boundary: anything that is not JSON with string `channel`, `name` and `id` is dropped
 *           (`undefined`), never thrown into the app; extra fields are not carried over.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (data-free refresh); the never-cut rule for validation at a trust boundary.
 */
import type { RealtimeMessage } from "#contracts/types/realtime-message.type";

/**
 * The message `text` holds, or `undefined` when it is not one.
 *
 * @example
 * decodeMessage('{"channel":"tenant.ten_1.orders","name":"orders.order.paid.v1","id":"evt_1"}');
 */
export function decodeMessage(text: string): RealtimeMessage | undefined {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof value !== "object" || value === null) return undefined;
  const { channel, name, id } = value as Record<string, unknown>;
  if (typeof channel !== "string" || typeof name !== "string" || typeof id !== "string")
    return undefined;
  return { channel, name, id };
}
