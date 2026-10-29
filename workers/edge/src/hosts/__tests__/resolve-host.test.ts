/**
 * Stackra file contract:
 * Purpose: unit tests of `resolveHost`: a listed host resolves in any case and with a trailing dot; an unknown host and
 *          an inherited object key resolve to null, never a default.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0437 (decision 2.1).
 */
import { resolveHost } from "#src/hosts/resolve-host";
import type { HostEntry } from "#src/interfaces/host-entry.interface";

const shop: HostEntry = { product: "commerce", surface: "console", realm: "staff", scope: "scp_1" };
const hosts = { "app.acme.example": shop };

describe("resolveHost", () => {
  it("resolves a listed host in any case and with a trailing dot", () => {
    expect(resolveHost(hosts, "app.acme.example")).toBe(shop);
    expect(resolveHost(hosts, "APP.Acme.Example.")).toBe(shop);
  });

  it("resolves an unknown host to null", () => {
    expect(resolveHost(hosts, "other.example")).toBeNull();
    expect(resolveHost(hosts, "constructor")).toBeNull();
  });
});
