/**
 * Stackra file contract:
 * Purpose: unit tests of `PUBLIC_ID_PREFIXES`, the shared prefix registry: every prefix is 2 to 6 lowercase letters,
 *          every owner is a `<member>.<thing>` identity, no owner holds two prefixes, it is frozen, and it holds the
 *          prefixes the platform packages mint today (their models' `HasPublicId` and their `PublicId<"x">` ids).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0135 (rule 2); ADR 0294 (decision 20).
 */
import { describe, expect, it } from "@stackra/testing";

import { PUBLIC_ID_PREFIXES } from "#core/constants/public-id-prefixes.constant";

describe("PUBLIC_ID_PREFIXES", () => {
  it("holds valid prefixes, one per owner identity", () => {
    const owners = Object.values(PUBLIC_ID_PREFIXES);
    for (const prefix of Object.keys(PUBLIC_ID_PREFIXES)) expect(prefix).toMatch(/^[a-z]{2,6}$/);
    for (const owner of owners) expect(owner).toMatch(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);
    expect(new Set(owners).size).toBe(owners.length);
    expect(Object.isFrozen(PUBLIC_ID_PREFIXES)).toBe(true);
  });

  it("registers the prefixes the platform packages mint", () => {
    expect(PUBLIC_ID_PREFIXES).toMatchObject({
      conn: "integrations.connection",
      rev: "content.revision",
      rset: "rules.rule_set",
      scp: "scope.scope_node",
      seg: "segments.segment",
      sgm: "segments.segment_membership",
      sqb: "database.sequence_block",
      usr: "identity.user",
      whe: "webhooks.webhook_endpoint",
    });
  });
});
