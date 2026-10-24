/**
 * Stackra file contract:
 * Purpose: unit tests of the `AuditTrail` port: it is an abstract `Port` (its own token, never built directly) and
 *          a driver stores entries.
 * Boundary: test only; the driver here is a stand-in for the implementing package's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0263 (ports).
 */
import { Driver } from "@stackra/container";
import { ActorKind, ApiArea, Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { AuditEntry } from "#contracts/types/audit-entry.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { AuditTrail } from "#contracts/ports/audit-trail.port";

const call: CallDescriptor = {
  callId: "call_1",
  type: class Fixture {},
  kind: "action",
  key: "orders.order.create@1",
  actor: { kind: ActorKind.System, id: "sys_1" },
  area: ApiArea.App,
};

class ListDriver extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

describe("AuditTrail", () => {
  it("is an abstract port", () => {
    expect(AuditTrail.prototype).toBeInstanceOf(Port);
  });

  it("is implemented by a driver", async () => {
    const driver = new ListDriver();
    const entry: AuditEntry = {
      call,
      at: new Date(0),
      outcome: "refused",
      code: "orders_paused",
      fields: { reason: "count" },
    };
    await driver.record(entry);
    expect(driver.entries).toEqual([entry]);
  });
});
