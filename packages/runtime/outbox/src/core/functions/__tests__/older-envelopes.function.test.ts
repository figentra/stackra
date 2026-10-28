/**
 * Stackra file contract:
 * Purpose: unit tests of `wireVersionOf` and `olderEnvelopes`: a wire name resolves to its registered class with the
 *          version it carries and the current one; a current envelope gets one older envelope per live change, same
 *          id, time, scope and metadata, its data run through `down`; past the sunset, for an older wire name or an
 *          unknown one there is none.
 * Boundary: test only; registers the schemas, the wire name and the change the way gen does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0141 (2026-10-23 note); ADR 0118 (2026-10-23 note); stackra-403.
 */
import { IntegrationEvent } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { Change, registerChanges } from "@stackra/versioning";
import { z } from "zod";

import type { EventEnvelope } from "#contracts/index";
import { olderEnvelopes } from "#core/functions/older-envelopes.function";
import { registerEventNames } from "#core/functions/register-event-names.function";
import { wireVersionOf } from "#core/functions/wire-version-of.function";

class PointsEarned extends IntegrationEvent({
  name: "points.earned",
  version: 2,
}) {
  memberId!: string;

  points!: number;

  tier!: string;
}

/** v1 had no tier. */
class PointsEarnedV1Change extends Change<PointsEarned>({
  from: 1,
  sunset: "2027-04-01",
}) {
  memberId!: string;

  points!: number;

  up(v1: PointsEarnedV1Change): PointsEarned {
    return PointsEarned.create({ ...v1, tier: "bronze" });
  }

  down(v2: PointsEarned): PointsEarnedV1Change {
    return PointsEarnedV1Change.create({ memberId: v2.memberId, points: v2.points });
  }
}

registerSchemas([
  [PointsEarned, z.object({ memberId: z.string(), points: z.number(), tier: z.string() })],
  [PointsEarnedV1Change, z.object({ memberId: z.string(), points: z.number() })],
]);
registerEventNames([{ type: PointsEarned, name: "loyalty.points.earned.v2" }]);
registerChanges([[PointsEarned, PointsEarnedV1Change]]);

const BEFORE_SUNSET = new Date("2026-10-29T12:00:00Z");

/** The current envelope of one occurrence. */
const current: EventEnvelope = {
  id: "evt_A",
  type: "loyalty.points.earned.v2",
  occurredAt: "2026-10-29T11:00:00.000Z",
  scope: { id: "scp_1", path: "platform.acme" },
  meta: { correlationId: "call-1" },
  data: { memberId: "mem_1", points: 5, tier: "gold" },
};

describe(wireVersionOf, () => {
  it("resolves the registered class with the carried and the current version", () => {
    expect(wireVersionOf("loyalty.points.earned.v2")).toEqual({
      type: PointsEarned,
      version: 2,
      current: 2,
    });
    expect(wireVersionOf("loyalty.points.earned.v1")).toEqual({
      type: PointsEarned,
      version: 1,
      current: 2,
    });
    expect(wireVersionOf("loyalty.points.earned.v3")?.version).toBe(3);
  });

  it("knows no other base and no unversioned name", () => {
    expect(wireVersionOf("loyalty.points.spent.v1")).toBeUndefined();
    expect(wireVersionOf("loyalty.points.earned")).toBeUndefined();
  });
});

describe(olderEnvelopes, () => {
  it("publishes the older version under the same id, its data run through down", () => {
    const [v1, ...rest] = olderEnvelopes(current, BEFORE_SUNSET);
    expect(rest).toEqual([]);
    expect({ ...v1, data: { ...(v1?.data as object) } }).toEqual({
      ...current,
      type: "loyalty.points.earned.v1",
      data: { memberId: "mem_1", points: 5 },
    });
    expect(v1?.data).toBeInstanceOf(PointsEarnedV1Change);
  });

  it("publishes none past the sunset, for an older wire name or an unknown one", () => {
    expect(olderEnvelopes(current, new Date("2027-04-01T00:00:00Z"))).toEqual([]);
    expect(olderEnvelopes({ ...current, type: "loyalty.points.earned.v1" }, BEFORE_SUNSET)).toEqual(
      [],
    );
    expect(olderEnvelopes({ ...current, type: "orders.order.paid.v1" }, BEFORE_SUNSET)).toEqual([]);
  });
});
