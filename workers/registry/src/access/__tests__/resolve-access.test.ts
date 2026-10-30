/**
 * Stackra file contract:
 * Purpose: tests of `resolveAccess`, the read-rule resolution shared by `gate` (npm routes) and the registry
 *          browser's package page: an open name, a licensed name with and without a licence that may read it, a
 *          `name_rules` internal name, and an unknown scope. The end-to-end outcomes of both callers (npm 401/403,
 *          browser full page, metadata only and 404) are in handle-request.test.ts and browse.test.ts.
 * Boundary: test only; D1 is node:sqlite with the real migrations.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 10 and 13); ADR 0461 (decision 3).
 */
import { activeLicence } from "#src/__tests__/fixtures/memory-bindings.fixture";
import { createTestRegistry, HOST } from "#src/__tests__/fixtures/registry.fixture";
import { resolveAccess } from "#src/access/resolve-access";

/** A request carrying `token`, or none. */
const requestWith = (token?: string): Request =>
  new Request(`https://${HOST}/`, {
    headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
  });

describe("resolveAccess", () => {
  it("resolves the scope rule, the name_rules override and the licence", async () => {
    const { deps, licences } = await createTestRegistry();
    licences.licences.set("stkl_customer", activeLicence());
    licences.licences.set("stkl_internal", activeLicence({ internal: true }));

    const open = await resolveAccess(deps, requestWith(), "@stackra/core");
    expect(open?.scope.read_rule).toBe("open");
    expect(open?.access.allowed).toBe(true);

    const pro = await resolveAccess(deps, requestWith(), "@stackra-pro/sync");
    expect(pro?.scope.read_rule).toBe("licensed");
    expect(pro?.access).toEqual(expect.objectContaining({ allowed: false, status: 401 }));
    expect(
      (await resolveAccess(deps, requestWith("stkl_customer"), "@stackra-pro/sync"))?.access
        .allowed,
    ).toBe(true);

    const ui = await resolveAccess(deps, requestWith("stkl_customer"), "@stackra-pro/ui");
    expect(ui?.scope.read_rule).toBe("internal");
    expect(ui?.access).toEqual(expect.objectContaining({ allowed: false, status: 403 }));
    expect(
      (await resolveAccess(deps, requestWith("stkl_internal"), "@stackra-pro/ui"))?.access.allowed,
    ).toBe(true);

    expect(await resolveAccess(deps, requestWith(), "@other/thing")).toBeNull();
  });
});
