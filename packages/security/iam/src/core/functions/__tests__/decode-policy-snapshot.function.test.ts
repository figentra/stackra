/**
 * Stackra file contract:
 * Purpose: unit tests of `decodePolicySnapshot`: an event's JSON becomes a snapshot with its instants as dates and its
 *          missing lists empty; an older event's `segments` key is ignored (ADR 0462); a malformed payload is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 4); ADR 0462.
 */
import { describe, expect, it } from "@stackra/testing";

import { decodePolicySnapshot } from "#core/functions/decode-policy-snapshot.function";

const ACME = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

describe("decodePolicySnapshot", () => {
  it("turns an event's JSON into a snapshot", () => {
    const snapshot = decodePolicySnapshot(
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the wire does (Dates become strings, undefined and functions drop)
      JSON.parse(
        JSON.stringify({
          version: 7,
          grants: [
            { role: "manager", scope: ACME, expiresAt: "2026-12-31T00:00:00Z", grantedBy: "usr_1" },
          ],
          roles: { manager: ["orders.order.read"] },
          segments: ["seg_1"],
          denies: [{ permission: "orders.*" }],
          breakGlass: [
            {
              role: "manager",
              scope: ACME,
              reason: "audit",
              openedBy: "usr_2",
              startsAt: "2026-10-25T08:00:00Z",
              expiresAt: "2026-10-25T10:00:00Z",
            },
          ],
        }),
      ),
    );
    expect(snapshot.version).toBe(7);
    expect(snapshot.grants[0]?.expiresAt).toEqual(new Date("2026-12-31T00:00:00Z"));
    expect(snapshot.grants[0]?.grantedBy).toBe("usr_1");
    expect(snapshot.breakGlass?.[0]?.startsAt).toEqual(new Date("2026-10-25T08:00:00Z"));
    expect(snapshot.visibility).toEqual([]);
    expect(snapshot.fields).toEqual([]);
    expect("segments" in snapshot).toBe(false);
  });

  it.each([
    [null],
    [{ version: "7" }],
    [{ version: 1, grants: [{ scope: ACME }] }],
    [{ version: 1, grants: [{ role: "x", scope: ACME, expiresAt: "soon" }] }],
    [{ version: 1, roles: { x: [1] } }],
    [{ version: 1, denies: ["x"] }],
    [{ version: 1, breakGlass: [{ role: "x", scope: ACME }] }],
  ])("refuses %j", (json) => {
    expect(() => decodePolicySnapshot(json)).toThrow(TypeError);
  });
});
