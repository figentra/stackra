/**
 * Stackra file contract:
 * Purpose: unit tests of `reachableConnections`: the levels are walked in the declared order, the user's own first
 *          when declared first, a scope connection serves its node and the nodes below it, nearest first, and a node
 *          beside or below the call's is never reached.
 * Boundary: test only; the context is a stand-in answering one scope node and one user.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 9 and 10); ADR 0327 (decision 3).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { reachableConnections } from "#core/functions/reachable-connections.function";
import { ConnectionContext } from "#core/ports/connection-context.port";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

const ROOT: ScopeRef = { id: "scp_00000000000000000000000001", path: "root" };
const ACME: ScopeRef = { id: "scp_00000000000000000000000002", path: "root.acme" };
const SHOP: ScopeRef = { id: "scp_00000000000000000000000003", path: "root.acme.shop" };
const OTHER: ScopeRef = { id: "scp_00000000000000000000000004", path: "root.acmex" };
const USER: PublicId<"usr"> = "usr_00000000000000000000000001";

/** A record of `level` owned by `owner`. */
function record(
  id: string,
  level: ConnectionLevel,
  owner: ScopeRef | PublicId<"usr">,
): ConnectionRecord {
  return {
    id: `conn_${id.padStart(26, "0")}`,
    level,
    ...(typeof owner === "string" ? { userId: owner } : { scope: owner }),
    fields: {},
    secrets: {},
    account: ConnectedAccount.create({ id }),
  };
}

/** A context acting in `scope` for `user`. */
const contextOf = (scope: ScopeRef | undefined, user: PublicId<"usr"> | undefined) =>
  Object.assign(Object.create(ConnectionContext.prototype) as ConnectionContext, {
    scope: () => scope,
    user: () => user,
  });

const RECORDS = [
  record("1", ConnectionLevel.Scope, ROOT),
  record("2", ConnectionLevel.Scope, ACME),
  record("3", ConnectionLevel.User, USER),
  record("4", ConnectionLevel.Scope, OTHER),
];

describe("reachableConnections", () => {
  it("walks the levels in order, nearest scope node first", () => {
    const tiers = reachableConnections(
      RECORDS,
      [ConnectionLevel.User, ConnectionLevel.Scope],
      contextOf(SHOP, USER),
    );
    expect(tiers.map((tier) => tier.records.map((r) => r.account.id))).toEqual([
      ["3"],
      ["2"],
      ["1"],
    ]);
    expect(tiers.map((tier) => tier.level)).toEqual(["user", "scope", "scope"]);
  });

  it("reaches only the declared levels", () => {
    const tiers = reachableConnections(RECORDS, [ConnectionLevel.Scope], contextOf(ACME, USER));
    expect(tiers.flatMap((tier) => tier.records.map((r) => r.account.id))).toEqual(["2", "1"]);
  });

  it("never reaches a node beside or below the call's", () => {
    expect(
      reachableConnections(RECORDS, [ConnectionLevel.Scope], contextOf(ROOT, undefined)).flatMap(
        (t) => t.records,
      ),
    ).toEqual([RECORDS[0]]);
    expect(
      reachableConnections(RECORDS, [ConnectionLevel.User], contextOf(undefined, undefined)),
    ).toEqual([]);
  });

  it("keeps two connections on one node in one tier", () => {
    const both = [...RECORDS, record("5", ConnectionLevel.Scope, ACME)];
    const [first] = reachableConnections(both, [ConnectionLevel.Scope], contextOf(SHOP, undefined));
    expect(first?.records.map((r) => r.account.id)).toEqual(["2", "5"]);
  });
});
