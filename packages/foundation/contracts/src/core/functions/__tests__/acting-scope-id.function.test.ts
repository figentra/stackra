/**
 * Stackra file contract:
 * Purpose: unit tests of `actingScopeId`: an agent or a service acts in its own tenant, else its user's, else none
 *          (a service with neither is a platform call); every other actor kind in its own `scopeId` only, never in the
 *          tenant of an actor it acts for.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0360; ADR 0495; ADR 0209 (2026-11-07 amendment, condition 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { ActorKind } from "#core/enums/actor-kind.enum";
import { Realm } from "#core/enums/realm.enum";
import { actingScopeId } from "#core/functions/acting-scope-id.function";
import type { Actor } from "#core/types/actor.type";

const A = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";
const B = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";
const userOfA: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff, scopeId: A };
const staff: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff };

describe(actingScopeId, () => {
  it("runs an agent in its own tenant, else in its human's, else as a platform call", () => {
    expect(
      actingScopeId({ kind: ActorKind.Agent, id: "agt_1", scopeId: B, onBehalfOf: userOfA }),
    ).toBe(B);
    expect(actingScopeId({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA })).toBe(A);
    expect(
      actingScopeId({ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: staff }),
    ).toBeUndefined();
  });

  it("runs a service in its own tenant, else in its user's, else as a platform call", () => {
    expect(
      actingScopeId({ kind: ActorKind.Service, id: "svc_1", scopeId: A, onBehalfOf: userOfA }),
    ).toBe(A);
    expect(actingScopeId({ kind: ActorKind.Service, id: "svc_1", onBehalfOf: userOfA })).toBe(A);
    expect(actingScopeId({ kind: ActorKind.Service, id: "svc_1", scopeId: B })).toBe(B);
    expect(actingScopeId({ kind: ActorKind.Service, id: "svc_1" })).toBeUndefined();
    expect(
      actingScopeId({ kind: ActorKind.Service, id: "svc_1", onBehalfOf: staff }),
    ).toBeUndefined();
  });

  it("runs any other actor in its own tenant only", () => {
    expect(actingScopeId(userOfA)).toBe(A);
    expect(
      actingScopeId({ kind: ActorKind.Job, id: "job_1", onBehalfOf: userOfA }),
    ).toBeUndefined();
  });
});
