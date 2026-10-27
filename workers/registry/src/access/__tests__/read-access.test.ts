/**
 * Stackra file contract:
 * Purpose: unit tests of the scope read rule: `bearer`, `licenceRefusal` (status, not-before, grace days, grants by
 *          name and `*`) and `readAccess` (open ignores tokens, licensed 401/403), and of `cachedLicenceCheck` (a hit
 *          skips the port, unknown tokens are not cached, the key is the token hash).
 * Boundary: pure, over the in-memory licence check and edge cache.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0453 (decisions 3, 10 and 13).
 */
import {
  activeLicence,
  MemoryEdgeCache,
  MemoryLicenceCheck,
} from "#src/__tests__/fixtures/memory-bindings.fixture";
import { NOW, SETTINGS } from "#src/__tests__/fixtures/registry.fixture";
import { cachedLicenceCheck } from "#src/access/cached-licence-check";
import { bearer } from "#src/access/bearer";
import { licenceRefusal } from "#src/access/licence-refusal";
import { readAccess } from "#src/access/read-access";
import type { ScopeRow } from "#src/interfaces/scope-row.interface";

const OPEN: ScopeRow = {
  scope: "@stackra",
  read_rule: "open",
  licence_rule: "open-source",
  commercial_licence: "SEE LICENSE IN LICENSE",
};
const PRO: ScopeRow = {
  ...OPEN,
  scope: "@stackra-pro",
  read_rule: "licensed",
  licence_rule: "commercial",
};

describe("bearer", () => {
  it("reads a bearer token", () => {
    expect(bearer("Bearer stkl_x")).toBe("stkl_x");
    expect(bearer("Basic abc")).toBeNull();
    expect(bearer(null)).toBeNull();
  });
});

/** The refusal of an active licence changed by `overrides`, read for `@stackra-pro/sync` at NOW. */
const refuse = (overrides: Parameters<typeof activeLicence>[0]) =>
  licenceRefusal(activeLicence(overrides), "@stackra-pro", "@stackra-pro/sync", 14, NOW);

describe("licenceRefusal", () => {
  it("allows an active licence with a covering grant", () => {
    expect(refuse({})).toBeNull();
    expect(
      refuse({ grants: [{ scope: "@stackra-pro", names: ["@stackra-pro/sync"] }] }),
    ).toBeNull();
  });

  it.each([
    [{ status: "revoked" as const }, "licence is revoked"],
    [{ notBefore: "2026-11-01T00:00:00.000Z" }, "licence is not valid yet"],
    [{ expiresAt: "2026-10-12T00:00:00.000Z" }, "licence has expired"],
    [
      { grants: [{ scope: "@figentra", names: "*" as const }] },
      "licence has no grant for @stackra-pro/sync",
    ],
  ])("refuses %#", (overrides, reason) => {
    expect(refuse(overrides)).toBe(reason);
  });

  it("keeps access inside the grace days", () => {
    expect(refuse({ expiresAt: "2026-10-14T00:00:00.000Z" })).toBeNull();
  });
});

describe("readAccess", () => {
  it("never reads a token on an open scope", async () => {
    const licences = new MemoryLicenceCheck();
    expect(await readAccess(OPEN, "@stackra/core", "Bearer bad", licences, SETTINGS, NOW)).toEqual({
      allowed: true,
      licence: null,
    });
    expect(licences.calls).toEqual([]);
  });

  it("answers 401 without a known token and 403 without a grant", async () => {
    const licences = new MemoryLicenceCheck();
    licences.licences.set("stkl_s", activeLicence({ status: "suspended" }));
    const read = (header: string | null) =>
      readAccess(PRO, "@stackra-pro/sync", header, licences, SETTINGS, NOW);
    expect(await read(null)).toEqual(expect.objectContaining({ allowed: false, status: 401 }));
    expect(await read("Bearer stkl_none")).toEqual(expect.objectContaining({ status: 401 }));
    expect(await read("Bearer stkl_s")).toEqual(
      expect.objectContaining({ status: 403, reason: "licence is suspended" }),
    );
  });
});

describe("cachedLicenceCheck", () => {
  it("caches known tokens by hash for the configured seconds", async () => {
    const inner = new MemoryLicenceCheck();
    inner.licences.set("stkl_good", activeLicence());
    const cache = new MemoryEdgeCache();
    const check = cachedLicenceCheck(inner, cache, 60);
    expect(await check.check("stkl_good")).toEqual(activeLicence());
    expect(await check.check("stkl_good")).toEqual(activeLicence());
    expect(await check.check("stkl_none")).toBeNull();
    expect(await check.check("stkl_none")).toBeNull();
    expect(inner.calls).toEqual([
      { token: "stkl_good" },
      { token: "stkl_none" },
      { token: "stkl_none" },
    ]);
    const [entry] = [...cache.entries.entries()];
    expect(entry?.[0]).not.toContain("stkl_good");
    expect(entry?.[1].cacheControl).toBe("max-age=60");
  });
});
