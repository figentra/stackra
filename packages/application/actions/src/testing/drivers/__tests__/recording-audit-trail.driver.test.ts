/**
 * Stackra file contract:
 * Purpose: unit tests of `RecordingAuditTrailDriver`: it keeps the last entry per call id and forwards each entry to
 *          the app's bound trail, and works with none bound.
 * Boundary: test only; the app is a map resolver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); STA-820.
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { AuditTrail } from "#contracts/index";
import type { AuditEntry } from "#contracts/index";
import type { Resolver } from "#core/index";
import { RecordingAuditTrailDriver } from "#testing/drivers/recording-audit-trail.driver";

class Kept extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

/** An entry of call `callId` with `outcome`. */
function entryOf(callId: string, outcome: "ok" | "refused"): AuditEntry {
  return {
    call: {
      callId,
      type: class {},
      kind: "action",
      key: "order.place",
      actor: { kind: ActorKind.User, id: "usr_1", realm: Realm.Customer },
      area: ApiArea.App,
    },
    at: new Date(0),
    outcome,
    fields: {},
  };
}

/** A resolver that binds `trail` as the app's AuditTrail, or nothing. */
function appWith(trail?: AuditTrail): Resolver {
  return {
    has: (token) => trail !== undefined && token === AuditTrail,
    get: <T extends object>() => trail as unknown as T,
  };
}

describe(RecordingAuditTrailDriver, () => {
  it("keeps the last entry per call and forwards it", async () => {
    const kept = new Kept();
    const trail = new RecordingAuditTrailDriver(appWith(kept));
    await trail.record(entryOf("c1", "ok"));
    await trail.record(entryOf("c1", "refused"));
    expect(trail.entryOf("c1")?.outcome).toBe("refused");
    expect(trail.entryOf("c2")).toBeUndefined();
    expect(kept.entries).toHaveLength(2);
  });

  it("records with no trail bound in the app", async () => {
    const trail = new RecordingAuditTrailDriver(appWith());
    await trail.record(entryOf("c1", "ok"));
    expect(trail.entryOf("c1")?.outcome).toBe("ok");
  });
});
