/**
 * Stackra file contract:
 * Purpose: unit tests of `actingTenant`: an agent acts in its own tenant, else its human's, else none; every other
 *          actor kind in its own `scopeId` only, never in the tenant of an actor it acts for.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0360; ADR 0495.
 */
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { actingTenant } from "#core/functions/acting-tenant.function";

const A = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";
const B = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";
const userOfA: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff, scopeId: A };
const staff: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff };

describe(actingTenant, () => {
  it("runs an agent in its own tenant, else in its human's, else as a platform call", () => {
    expect(
      actingTenant({ kind: ActorKind.Agent, id: "agt_1", scopeId: B, onBehalfOf: userOfA }),
    ).toBe(B);
    expect(actingTenant({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA })).toBe(A);
    expect(actingTenant({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: staff })).toBeUndefined();
  });

  it("runs any other actor in its own tenant only", () => {
    expect(actingTenant(userOfA)).toBe(A);
    expect(
      actingTenant({ kind: ActorKind.Service, id: "svc_1", onBehalfOf: userOfA }),
    ).toBeUndefined();
    expect(actingTenant({ kind: ActorKind.Job, id: "job_1", onBehalfOf: userOfA })).toBeUndefined();
  });
});
