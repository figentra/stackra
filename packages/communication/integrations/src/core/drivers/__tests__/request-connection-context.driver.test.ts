/**
 * Stackra file contract:
 * Purpose: unit tests of `RequestConnectionContextDriver`: the call's scope, the user a call acts for (directly or
 *          on behalf of), and no owner outside a call or for a subject that is not a user.
 * Boundary: test only; `RequestContext` reads a fake `ContextStorage` that holds one call context or none.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 9); ADR 0327 (decisions 5 and 6).
 */
import { RequestContext } from "@stackra/actions";
import { ContextStorage } from "@stackra/actions/contracts";
import { fakeExtensionContext } from "@stackra/actions/testing";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionContext } from "#contracts/ports/connection-context.port";
import { RequestConnectionContextDriver } from "#core/drivers/request-connection-context.driver";

const SCOPE: ScopeRef = { id: "scp_00000000000000000000000001", path: "root.acme" };

const USER: Actor = {
  kind: ActorKind.User,
  id: "usr_00000000000000000000000001",
  realm: Realm.Tenant,
};

const SERVICE: Actor = { kind: ActorKind.Service, id: "svc_00000000000000000000000001" };

/** Holds the context of one running call, or none. */
class FakeContextStorage extends ContextStorage {
  value: object | undefined;

  run<T>(value: object, work: () => T): T {
    this.value = value;
    return work();
  }

  current(): object | undefined {
    return this.value;
  }
}

/** A driver over a call made by `actor` in `scope`, or outside every call when `actor` is undefined. */
function contextOf(actor?: Actor, scope?: ScopeRef): RequestConnectionContextDriver {
  const storage = new FakeContextStorage();
  if (actor !== undefined)
    storage.value = fakeExtensionContext(scope === undefined ? { actor } : { actor, scope });
  return new RequestConnectionContextDriver(new RequestContext(storage));
}

describe("RequestConnectionContextDriver", () => {
  it("is the ConnectionContext port", () => {
    expect(contextOf()).toBeInstanceOf(ConnectionContext);
  });

  it("answers the call's scope and its user", () => {
    const context = contextOf(USER, SCOPE);
    expect(context.scope()).toEqual(SCOPE);
    expect(context.user()).toBe("usr_00000000000000000000000001");
  });

  it("answers the user a service acts on behalf of", () => {
    const context = contextOf({ ...SERVICE, onBehalfOf: USER }, SCOPE);
    expect(context.user()).toBe("usr_00000000000000000000000001");
  });

  it("answers no user for a service subject, and no scope for a platform call", () => {
    const context = contextOf(SERVICE);
    expect(context.user()).toBeUndefined();
    expect(context.scope()).toBeUndefined();
  });

  it("answers no user when a user acts on behalf of a system subject", () => {
    const system: Actor = { kind: ActorKind.System, id: "sys_00000000000000000000000001" };
    expect(contextOf({ ...USER, onBehalfOf: system }, SCOPE).user()).toBeUndefined();
  });

  it("answers nothing outside every call", () => {
    const context = contextOf();
    expect(context.scope()).toBeUndefined();
    expect(context.user()).toBeUndefined();
  });
});
