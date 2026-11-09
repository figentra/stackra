/**
 * Stackra file contract:
 * Purpose: unit tests of `actorOf`: a user token is the `user` actor with its realm and the tenant of its scope path; a
 *          service account's token is the `service` actor of its principal, whatever user claims it carries; an
 *          unknown subject, a missing or mistyped claim and a scope path outside the memberships are refused
 *          `unauthenticated`, never Anonymous.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3); ADR 0098 (decisions 6 and 7); STA-2558.
 */
import { ActorKind, Realm } from "@stackra/contracts";
import { UnauthenticatedError } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { IDENTITY_CLAIMS } from "#core/constants/identity-claims.constant";
import { MemoryServicePrincipalsDriver } from "#core/drivers/memory-service-principals.driver";
import { actorOf } from "#core/functions/actor-of.function";

const USER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w4";
const SERVICE_ID = "svc_01j9z3k4m5n6p7q8r9s0t1v2w5";
const SERVICE_SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w6";
const MACHINE_SUBJECT = "312909075212468999";

/** The claims of a user's access token. */
const USER_CLAIMS = {
  sub: "312909075212468632",
  [IDENTITY_CLAIMS.userId]: USER_ID,
  [IDENTITY_CLAIMS.realm]: Realm.Staff,
  [IDENTITY_CLAIMS.scopePath]: "platform.acme",
  [IDENTITY_CLAIMS.memberships]: [
    { scopeId: SCOPE_ID, path: "platform.acme", name: "Acme", roles: ["admin"] },
  ],
};

const principals = new MemoryServicePrincipalsDriver().seed({
  [MACHINE_SUBJECT]: { id: SERVICE_ID, key: "ship.shipping", scopeId: SERVICE_SCOPE_ID },
});

describe(actorOf, () => {
  it("maps a user token to a user actor in the tenant of its scope path", async () => {
    expect(await actorOf(USER_CLAIMS, principals)).toEqual({
      kind: ActorKind.User,
      id: USER_ID,
      realm: Realm.Staff,
      scopeId: SCOPE_ID,
    });
    const { [IDENTITY_CLAIMS.scopePath]: _path, ...platform } = USER_CLAIMS;
    expect(await actorOf(platform, principals)).toEqual({
      kind: ActorKind.User,
      id: USER_ID,
      realm: Realm.Staff,
    });
  });

  it("maps a service account's token to its principal's service actor", async () => {
    expect(await actorOf({ sub: MACHINE_SUBJECT, client_id: "ship" }, principals)).toEqual({
      kind: ActorKind.Service,
      id: SERVICE_ID,
      scopeId: SERVICE_SCOPE_ID,
    });
    const platform = new MemoryServicePrincipalsDriver().seed({
      [MACHINE_SUBJECT]: { id: SERVICE_ID, key: "ship.shipping" },
    });
    expect(await actorOf({ sub: MACHINE_SUBJECT }, platform)).toEqual({
      kind: ActorKind.Service,
      id: SERVICE_ID,
    });
  });

  it("gives a service account its principal's id only, whatever user claims it carries", async () => {
    const actor = await actorOf({ ...USER_CLAIMS, sub: MACHINE_SUBJECT }, principals);
    expect(actor).toEqual({ kind: ActorKind.Service, id: SERVICE_ID, scopeId: SERVICE_SCOPE_ID });
  });

  it("refuses an unknown machine subject", async () => {
    await expect(actorOf({ sub: "312909075212460000" }, principals)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it.each([
    ["no subject", { ...USER_CLAIMS, sub: undefined }],
    ["a subject that is not text", { ...USER_CLAIMS, sub: 42 }],
    ["no user id", { ...USER_CLAIMS, [IDENTITY_CLAIMS.userId]: undefined }],
    ["a user id that is not a usr_ id", { ...USER_CLAIMS, [IDENTITY_CLAIMS.userId]: SERVICE_ID }],
    ["no realm", { ...USER_CLAIMS, [IDENTITY_CLAIMS.realm]: undefined }],
    ["an unknown realm", { ...USER_CLAIMS, [IDENTITY_CLAIMS.realm]: "root" }],
    ["memberships that are not a list", { ...USER_CLAIMS, [IDENTITY_CLAIMS.memberships]: "x" }],
    ["a scope path outside the memberships", { ...USER_CLAIMS, [IDENTITY_CLAIMS.scopePath]: "x" }],
  ])("refuses a token with %s", async (_case, claims) => {
    await expect(actorOf(claims, principals)).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
