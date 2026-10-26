/**
 * Stackra file contract:
 * Purpose: `webhookObjectKey(target, type, eventId, at)`, the key one delivery is written to on an S3 target:
 *          `<prefix>/<type>/<yyyy>/<mm>/<dd>/<eventId>.json`, the event's UTC day, so a SIEM lists a day of one event
 *          type by prefix.
 * Boundary: pure. The key is the event's, never the attempt's, so a retried attempt rewrites the same object.
 * Runtime: isomorphic
 * Governing contract: ADR 0422 (decision 4).
 */
import type { S3Target } from "#core/types/s3-target.type";

/**
 * The object key of event `eventId` of wire name `type`, which occurred at `at`.
 *
 * @example
 * webhookObjectKey({ bucket: "b", prefix: "siem" }, "orders.order.paid.v1", "evt_1", at); // "siem/orders.order.paid.v1/2026/10/26/evt_1.json"
 */
export function webhookObjectKey(
  target: S3Target,
  type: string,
  eventId: string,
  at: Date,
): string {
  const day = at.toISOString().slice(0, 10).replaceAll("-", "/");
  const key = `${type}/${day}/${eventId}.json`;
  return target.prefix === "" ? key : `${target.prefix}/${key}`;
}
