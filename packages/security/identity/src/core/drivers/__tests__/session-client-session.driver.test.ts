/**
 * Stackra file contract:
 * Purpose: unit tests of `SessionClientSessionDriver`: it is the clients package's `ClientSession`; a call carries the
 *          bearer token and the active scope's path when there are some and neither otherwise; `can` reads the
 *          signed-in user's permissions and is `false` signed out.
 * Boundary: test only; the session runs over a test store with a token.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 3); ADR 0327 (decision 7).
 */
import { ClientSession } from "@stackra/clients/contracts";
import { buildConfig } from "@stackra/config";
import { PermissionSnapshotService } from "@stackra/iam";
import { ActiveScopeService } from "@stackra/scope";
import { TenantSwitcher } from "@stackra/tenancy";
import { describe, expect, it } from "@stackra/testing";

import { IdentityConfig } from "#config/identity.config";
import type { SessionUser } from "#contracts/types/session-user.type";
import { MemorySessionStoreDriver } from "#core/drivers/memory-session-store.driver";
import { SessionClientSessionDriver } from "#core/drivers/session-client-session.driver";
import { SessionService } from "#core/services/session.service";

/** A signed-in user holding one permission. */
const USER: SessionUser = {
  userId: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  email: "rana@acme.example",
  displayName: "Rana",
  permissions: ["orders.order.cancel"],
  memberships: [],
};

/** A memory store whose signed-in session has a token. */
class TokenStoreDriver extends MemorySessionStoreDriver {
  override async accessToken(): Promise<string | undefined> {
    return (await this.load()) === null ? undefined : "access-1";
  }
}

/** A started session over `store`, its scope and the driver under test. */
async function setup(signedIn: boolean) {
  const scope = new ActiveScopeService();
  const session = new SessionService(
    buildConfig(IdentityConfig),
    new TokenStoreDriver().seed(USER, signedIn),
    new TenantSwitcher(scope),
    new PermissionSnapshotService(),
  );
  await session.start();
  return { scope, driver: new SessionClientSessionDriver(session, scope) };
}

describe("SessionClientSessionDriver", () => {
  it("is the clients package's ClientSession", async () => {
    const { driver } = await setup(true);
    expect(driver).toBeInstanceOf(ClientSession);
  });

  it("sends the bearer token and the active scope's path", async () => {
    const { scope, driver } = await setup(true);
    scope.set({ id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w4", path: "platform.acme" });
    expect(await driver.headers()).toEqual({
      Authorization: "Bearer access-1",
      "X-Scope-Path": "platform.acme",
    });
  });

  it("sends neither signed out with no active scope", async () => {
    const { driver } = await setup(false);
    expect(await driver.headers()).toEqual({});
  });

  it("answers can from the signed-in user's permissions", async () => {
    expect((await setup(true)).driver.can("orders.order.cancel")).toBe(true);
    expect((await setup(true)).driver.can("orders.order.delete")).toBe(false);
    expect((await setup(false)).driver.can("orders.order.cancel")).toBe(false);
  });
});
