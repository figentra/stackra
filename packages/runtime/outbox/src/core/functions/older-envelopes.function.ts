/**
 * Stackra file contract:
 * Purpose: `olderEnvelopes(envelope, on)`, the envelopes of the older versions of an integration event that are still
 *          published beside its current one (ADR 0141: both are published until the change's sunset): each is the
 *          same occurrence (same id, time, scope and metadata) under `<base>.v<from>`, its data run through that
 *          version's `Change.down`.
 * Boundary: internal (not in a barrel); the relay publishes them after the current envelope. Pure over the
 *           `EVENT_NAMES` and change registries. An envelope whose wire name this process does not register as an
 *           event's current version, or whose event has no live change, has none. Sharing the id keeps the inbox's
 *           dedup whole: a consumer that reads both versions runs its listeners once.
 * Runtime: isomorphic
 * Governing contract: ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note); ADR 0078 (decision 4).
 */
import type { Event, EventClass } from "@stackra/events";
import { downgrade, publishedVersions } from "@stackra/versioning";

import type { EventEnvelope } from "#contracts/index";
import { wireVersionOf } from "#core/functions/wire-version-of.function";

/**
 * The older-version envelopes of `envelope` published on `on`, oldest first.
 *
 * @throws ZodError when the envelope's data breaks its event's schema.
 * @example
 * olderEnvelopes({ id, type: "loyalty.points.earned.v2", ... }, now); // [{ id, type: "loyalty.points.earned.v1", ... }]
 */
export function olderEnvelopes(envelope: EventEnvelope, on: Date): readonly EventEnvelope[] {
  const wire = wireVersionOf(envelope.type);
  if (wire === undefined || wire.version !== wire.current) return [];
  const versions = publishedVersions(wire.type, on);
  if (versions.length === 0) return [];
  const type = wire.type as EventClass<Event>;
  const event = envelope.data instanceof type ? envelope.data : type.create(envelope.data as never);
  const base = envelope.type.slice(0, envelope.type.lastIndexOf(".v"));
  return versions.map((version) =>
    Object.freeze({
      ...envelope,
      type: `${base}.v${version}`,
      data: downgrade(type, event, version),
    }),
  );
}
