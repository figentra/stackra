/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantScopeOwnershipDriver`: a platform actor holds any scope; a tenant actor holds its own
 *          tenant's scope and a branch below it, and no other tenant's scope, a scope above every tenant, or none; the
 *          tree is read in a scope session over the root label of the scope's path, rolled back after the read, so a
 *          tree under row security (no node outside a session, only the session's subtree inside one) still answers;
 *          a driver built the 0.33 way, with no database (stale generated wiring), fails closed: it never trusts a
 *          tenant actor (the changeset's compatibility note, STA-1717).
 * Boundary: test only; the tree is the scope package's memory driver, and a fake `Database` records each scope session
 *           and, in the last test, a tree that answers only inside one stands in for the row security.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495 (decision 2).
 */
import { ScopeOwnership } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { describe, expect, it } from "@stackra/testing";

import { TenantScopeOwnershipDriver } from "#core/drivers/tenant-scope-ownership.driver";

const ROOT: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w0",
  path: "platform",
  level: "platform",
  name: "Platform",
};
const ACME: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1",
  path: "platform.acme",
  level: "tenant",
  name: "Acme",
};
const GLOBEX: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2",
  path: "platform.globex",
  level: "tenant",
  name: "Globex",
};
const BRANCH: ScopeEntry = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3",
  path: "platform.acme.riyadh",
  level: "branch",
  name: "Riyadh",
};

/** The scope sessions a fake database opened, by path, and the one open now (none: outside every session). */
const sessions: { opened: string[]; open: string | undefined } = { opened: [], open: undefined };

/** A database that only records each scope session and runs its work, which it rolls back by rethrowing. */
const database = {
  withScope: async <T>(
    scope: ScopeRef | readonly ScopeRef[],
    work: () => Promise<T>,
  ): Promise<T> => {
    const { path } = scope as ScopeRef;
    sessions.opened.push(path);
    sessions.open = path;
    try {
      return await work();
    } finally {
      sessions.open = undefined;
    }
  },
} as unknown as Database;

/** A tree under row security: no node outside a scope session, only the session's own subtree inside one. */
class RowSecureTree extends MemoryScopeTreeDriver {
  override async node(id: ScopeEntry["id"]): Promise<ScopeEntry | undefined> {
    const node = await super.node(id);
    return node !== undefined && this.shows(node.path) ? node : undefined;
  }

  override async ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (await super.ancestors(scope)).filter((entry) => this.shows(entry.path));
  }

  private shows(path: string): boolean {
    const { open } = sessions;
    return open !== undefined && (path === open || path.startsWith(`${open}.`));
  }
}

const driver = new TenantScopeOwnershipDriver(
  new MemoryScopeTreeDriver().seed([ROOT, ACME, GLOBEX, BRANCH]),
  database,
);
const actorIn = (scopeId?: Actor["scopeId"]): Actor => ({
  kind: ActorKind.Service,
  id: "svc_orders",
  ...(scopeId === undefined ? {} : { scopeId }),
});

describe(TenantScopeOwnershipDriver, () => {
  it("is a ScopeOwnership driver", () => {
    expect(driver).toBeInstanceOf(ScopeOwnership);
  });

  it("holds any scope for a platform actor", async () => {
    await expect(driver.holds(actorIn(), ACME)).resolves.toBe(true);
    await expect(driver.holds(actorIn(), undefined)).resolves.toBe(true);
  });

  it("holds its own tenant's scope and a branch below it", async () => {
    await expect(driver.holds(actorIn(ACME.id), ACME)).resolves.toBe(true);
    await expect(driver.holds(actorIn(ACME.id), BRANCH)).resolves.toBe(true);
  });

  it("holds no other tenant's scope, no scope above every tenant and no absent scope", async () => {
    await expect(driver.holds(actorIn(ACME.id), GLOBEX)).resolves.toBe(false);
    await expect(driver.holds(actorIn(GLOBEX.id), BRANCH)).resolves.toBe(false);
    await expect(driver.holds(actorIn(ACME.id), ROOT)).resolves.toBe(false);
    await expect(driver.holds(actorIn(ACME.id), undefined)).resolves.toBe(false);
  });

  it("reads the tree in a session over the root label of the scope's path, so a tree under row security answers", async () => {
    sessions.opened = [];
    const secure = new TenantScopeOwnershipDriver(
      new RowSecureTree().seed([ROOT, ACME, GLOBEX, BRANCH]),
      database,
    );
    await expect(secure.holds(actorIn(ACME.id), BRANCH)).resolves.toBe(true);
    await expect(secure.holds(actorIn(GLOBEX.id), BRANCH)).resolves.toBe(false);
    expect(sessions.opened).toEqual(["platform", "platform"]);
    expect(sessions.open).toBeUndefined();
  });

  it("fails closed when built the 0.33 way, without a database: a tenant actor is never held", async () => {
    // Stale generated wiring lists only the tree, so the container constructs the driver with one argument.
    const stale = new TenantScopeOwnershipDriver(
      new MemoryScopeTreeDriver().seed([ROOT, ACME, GLOBEX, BRANCH]),
      undefined as unknown as Database,
    );
    await expect(stale.holds(actorIn(ACME.id), BRANCH)).rejects.toThrow(TypeError);
    await expect(stale.holds(actorIn(ACME.id), ACME)).rejects.toThrow(TypeError);
    await expect(stale.holds(actorIn(), ACME)).resolves.toBe(true);
  });

  it("opens no session for a platform actor or an absent scope", async () => {
    sessions.opened = [];
    await expect(driver.holds(actorIn(), ACME)).resolves.toBe(true);
    await expect(driver.holds(actorIn(ACME.id), undefined)).resolves.toBe(false);
    expect(sessions.opened).toEqual([]);
  });
});
