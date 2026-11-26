/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryIdpOrganizationsDriver`: it is the `IdpOrganizations` port; a linked scope answers its
 *          organisation and node by the node's id, a relink replaces it, and an unlinked scope or a descendant of a
 *          linked one answers none.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0263; STA-2817.
 */
import { describe, expect, it } from "@stackra/testing";

import { IdpOrganizations } from "#contracts/index";
import { MemoryIdpOrganizationsDriver } from "#core/drivers/memory-idp-organizations.driver";

const ACME = { id: "scp_acme", path: "platform.acme" } as const;
const OTHER = { id: "scp_other", path: "platform.other" } as const;
const BRANCH = { id: "scp_acme_branch", path: "platform.acme.branch" } as const;

describe(MemoryIdpOrganizationsDriver, () => {
  it("answers a linked scope's organisation, the last link winning, and none for another", async () => {
    const organizations = new MemoryIdpOrganizationsDriver().link(ACME.id, "org_1");
    expect(organizations).toBeInstanceOf(IdpOrganizations);
    expect(await organizations.organizationOf(ACME)).toEqual({
      organizationId: "org_1",
      scopeId: ACME.id,
    });
    organizations.link(ACME.id, "org_2");
    expect(await organizations.organizationOf(ACME)).toEqual({
      organizationId: "org_2",
      scopeId: ACME.id,
    });
    expect(await organizations.organizationOf(OTHER)).toBeUndefined();
    // A branch's people sign in through Acme's organisation, but the branch node itself has none.
    expect(await organizations.organizationOf(BRANCH)).toBeUndefined();
  });
});
