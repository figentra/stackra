/**
 * Stackra file contract:
 * Purpose: unit tests of `checkHostedPeers`: a library using an integrations value as a dependency is refused, the same
 *          as a peer passes, a type-only import or the `/contracts` subpath needs no peer, and the package itself is
 *          never asked to be its own peer.
 * Boundary: test only; pure function, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308; the payments 0.21.0 packaging regression (2026-11-08).
 */
import { describe, expect, it } from "vitest";

import { checkHostedPeers } from "#node/functions/check-hosted-peers.function";
import type { PackageManifest } from "#node/types/package-manifest.type";

/** A library that declares integrations as a dependency or as a peer. */
const library = (as: "dependencies" | "peerDependencies"): PackageManifest => ({
  name: "@stackra/payments",
  [as]: { "@stackra/integrations": "workspace:*" },
});

/** A Connection subclass: a value of integrations. */
const VALUE = 'import { Connection, makeConnection } from "@stackra/integrations";\n';

describe("checkHostedPeers", () => {
  /** A dependency gives the library its own copy, whose classes the host's store does not know. */
  it("refuses a library that uses an integrations value as a dependency", () => {
    expect(checkHostedPeers({ pkg: library("dependencies"), sources: [VALUE] })).toEqual([
      expect.stringContaining("@stackra/integrations must be a peer"),
    ]);
  });

  /** As a peer there is one copy, the host's. */
  it("accepts the same library with integrations as a peer", () => {
    expect(checkHostedPeers({ pkg: library("peerDependencies"), sources: [VALUE] })).toEqual([]);
  });

  /** Types and plain enums carry no identity, so a dependency is fine for them. */
  it("needs no peer for types only or the contracts subpath", () => {
    const sources = [
      'import type { ConnectionClass } from "@stackra/integrations";\n',
      'import { type IntegrationApi, type ProviderDrivers } from "@stackra/integrations";\n',
      'import { MobileStore } from "@stackra/integrations/contracts";\n',
    ];
    expect(checkHostedPeers({ pkg: library("dependencies"), sources })).toEqual([]);
  });

  /** A re-export is a value use too. */
  it("counts a value re-export", () => {
    const sources = ['export { ProviderRefusedError } from "@stackra/integrations";\n'];
    expect(checkHostedPeers({ pkg: library("dependencies"), sources })).toHaveLength(1);
  });

  /** The package is its own source of truth. */
  it("never asks integrations to be its own peer", () => {
    expect(checkHostedPeers({ pkg: { name: "@stackra/integrations" }, sources: [VALUE] })).toEqual(
      [],
    );
  });
});
