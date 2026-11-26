/**
 * Stackra file contract:
 * Purpose: unit tests of `checkForkingPeers`: a test-only package (by name or scope) as a peer is refused, as is an
 *          optional react-dom; a required react-dom, a test-only package in devDependencies and an ordinary optional
 *          peer pass.
 * Boundary: test only; pure function, no disk.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); the peers-that-fork fix (2026-11-08).
 */
import { describe, expect, it } from "vitest";

import { checkForkingPeers } from "#node/functions/check-forking-peers.function";

describe("checkForkingPeers", () => {
  /** A peer some members install and others do not splits every dependent in two. */
  it("refuses a test-only package as a peer, by name or by scope", () => {
    const findings = checkForkingPeers({
      name: "@stackra/database",
      peerDependencies: {
        "@electric-sql/pglite": "catalog:",
        "@testing-library/react": "catalog:",
      },
      peerDependenciesMeta: { "@electric-sql/pglite": { optional: true } },
    });
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain("@electric-sql/pglite is test-only");
  });

  /** The web renderer forks as an optional peer, never as a required one. */
  it("refuses an optional react-dom and accepts a required one", () => {
    expect(
      checkForkingPeers({
        name: "@stackra/ui",
        peerDependencies: { "react-dom": ">=19.2.0" },
        peerDependenciesMeta: { "react-dom": { optional: true } },
      }),
    ).toEqual([expect.stringContaining("react-dom is optional")]);
    expect(
      checkForkingPeers({ name: "@stackra/ui", peerDependencies: { "react-dom": ">=19.2.0" } }),
    ).toEqual([]);
  });

  /** devDependencies never fork an install, and other optional peers are out of scope. */
  it("accepts test-only packages in devDependencies and ordinary optional peers", () => {
    expect(
      checkForkingPeers({
        name: "@stackra/database",
        devDependencies: { "@electric-sql/pglite": "catalog:" },
        peerDependencies: { "@stackra/events": "workspace:*" },
        peerDependenciesMeta: { "@stackra/events": { optional: true } },
      }),
    ).toEqual([]);
  });

  /** A test library is only ever a devDependency, so its peers never reach a real install. */
  it("lets the testing library itself take test-only peers", () => {
    expect(
      checkForkingPeers({
        name: "@stackra/testing",
        peerDependencies: { "@testing-library/react": "catalog:frontend" },
      }),
    ).toEqual([]);
  });
});
