/**
 * Stackra file contract:
 * Purpose: unit tests of `BootstrapOperatorAction`: a service-only (system permission), platform-area, no-tool action
 *          on `POST /platform/operators/bootstrap`; it grants the owner role (or the named one) at the platform node
 *          once, answers `already_granted` on a second run without writing, `would_grant` on a dry run without
 *          writing, and `not_found` for an unknown email; the audit carries the user id, role and outcome and never
 *          the email.
 * Boundary: test only; the memory identity provider and scope tree, and a set-backed grant store that records every
 *           call, stand in for ZITADEL and the IAM service.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0462; ADR 0208; STA-1586.
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { Driver, kindOf } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  ApiArea,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { ForbiddenError } from "@stackra/errors";
import { SystemRole } from "@stackra/iam";
import { type Grant, RoleGrants, RolesAtNode } from "@stackra/iam/contracts";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { describe, expect, it } from "@stackra/testing";

import { OperatorBootstrapOutcome } from "#contracts/index";
import { MemoryIdpAdminDriver } from "#core/drivers/memory-idp-admin.driver";
import { BootstrapOperatorAction } from "#node/actions/bootstrap-operator.action";
import { BootstrapOperatorInput } from "#node/schemas/bootstrap-operator-input.schema";

const ROOT = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform" } as const;

/** Grants kept in a set; records every call. */
class SetRoleGrantsDriver extends Driver(RoleGrants) {
  readonly held = new Set<string>();

  readonly calls: [PublicId, Grant][] = [];

  grant(principal: PublicId, grant: Grant): Promise<boolean> {
    this.calls.push([principal, grant]);
    const key = `${principal}:${grant.role}:${grant.scope.path}`;
    const written = !this.held.has(key);
    this.held.add(key);
    return Promise.resolve(written);
  }
}

/** The roles `SetRoleGrantsDriver` holds; records every call. */
class SetRolesAtNodeDriver extends Driver(RolesAtNode) {
  readonly grants: SetRoleGrantsDriver;

  readonly calls: [Actor, ScopeRef][] = [];

  constructor(grants: SetRoleGrantsDriver) {
    super();
    this.grants = grants;
  }

  of(principal: Actor, scope: ScopeRef): Promise<ReadonlySet<string>> {
    this.calls.push([principal, scope]);
    const roles = [...this.grants.held]
      .map((key) => key.split(":"))
      .filter(([id, , path]) => id === principal.id && path === scope.path)
      .map(([, role]) => role ?? "");
    return Promise.resolve(new Set(roles));
  }
}

/** A call from the ops service account, acting for no one. */
function serviceCtx() {
  const actor = { kind: ActorKind.Service, id: "svc_ops_bootstrap", realm: Realm.Platform };
  return fakeActionContext({ actor } as never);
}

/** The action over a provider holding rana as `usr_1`. */
async function setup() {
  const idp = new MemoryIdpAdminDriver();
  await idp.createUser({
    organizationId: "org_1",
    username: "rana",
    givenName: "Rana",
    familyName: "Haddad",
    email: "rana@acme.example",
    stackraUserId: "usr_1",
  });
  const tree = new MemoryScopeTreeDriver().seed([{ ...ROOT, level: "platform", name: "Platform" }]);
  const grants = new SetRoleGrantsDriver();
  const action = new BootstrapOperatorAction(idp, new SetRolesAtNodeDriver(grants), grants, tree);
  return { action, grants };
}

describe(BootstrapOperatorAction, () => {
  it("is a platform action no user, agent or tool can use", () => {
    const options = kindOf(BootstrapOperatorAction)?.options;
    expect(options?.["actors"]).toEqual([ActorKind.Service, ActorKind.User]);
    expect(options?.["area"]).toBe(ApiArea.Platform);
    expect(options?.["endpoint"]).toEqual({
      method: "POST",
      path: "/platform/operators/bootstrap",
    });
    expect(options?.["tool"]).toBe(false);
  });

  it("grants the owner role at the platform node once", async () => {
    const { action, grants } = await setup();
    const ctx = serviceCtx();
    const first = await action.handle(
      BootstrapOperatorInput.create({ email: "rana@acme.example" }),
      ctx,
    );
    expect(first).toMatchObject({
      outcome: OperatorBootstrapOutcome.Granted,
      role: SystemRole.Owner,
      userId: "usr_1",
    });
    expect(grants.calls).toEqual([
      ["usr_1", { role: SystemRole.Owner, scope: ROOT, grantedBy: ctx.actor.id }],
    ]);
    expect(ctx).toHaveAudited({
      fields: {
        userId: "usr_1",
        role: SystemRole.Owner,
        outcome: OperatorBootstrapOutcome.Granted,
      },
    });
    const again = await action.handle(
      BootstrapOperatorInput.create({ email: "RANA@acme.example" }),
      serviceCtx(),
    );
    expect(again.outcome).toBe(OperatorBootstrapOutcome.AlreadyGranted);
    expect(grants.calls).toHaveLength(1);
  });

  it("grants a named role and writes nothing on a dry run", async () => {
    const { action, grants } = await setup();
    const dry = await action.handle(
      BootstrapOperatorInput.create({
        email: "rana@acme.example",
        role: SystemRole.Staff,
        dryRun: true,
      }),
      serviceCtx(),
    );
    expect(dry).toMatchObject({
      outcome: OperatorBootstrapOutcome.WouldGrant,
      role: SystemRole.Staff,
    });
    expect(grants.calls).toEqual([]);
    const done = await action.handle(
      BootstrapOperatorInput.create({ email: "rana@acme.example", role: SystemRole.Staff }),
      serviceCtx(),
    );
    expect(done.outcome).toBe(OperatorBootstrapOutcome.Granted);
  });

  it("refuses a user, or a service acting for someone", async () => {
    const { action, grants } = await setup();
    const input = BootstrapOperatorInput.create({ email: "rana@acme.example" });
    const user = { kind: ActorKind.User, id: "usr_9", realm: Realm.Platform };
    await expect(
      action.handle(input, fakeActionContext({ actor: user } as never)),
    ).rejects.toBeInstanceOf(ForbiddenError);
    const relayed = {
      kind: ActorKind.Service,
      id: "svc_x",
      realm: Realm.Platform,
      onBehalfOf: user,
    };
    await expect(
      action.handle(input, fakeActionContext({ actor: relayed } as never)),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(grants.calls).toEqual([]);
  });

  it("answers not_found for an unknown email and never audits the email", async () => {
    const { action, grants } = await setup();
    const ctx = serviceCtx();
    const out = await action.handle(
      BootstrapOperatorInput.create({ email: "nobody@acme.example" }),
      ctx,
    );
    expect(out.outcome).toBe(OperatorBootstrapOutcome.NotFound);
    expect(out.userId).toBeUndefined();
    expect(grants.calls).toEqual([]);
    expect(JSON.stringify(ctx.recorded.audit)).not.toContain("nobody@acme.example");
  });
});
