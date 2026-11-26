/**
 * Stackra file contract:
 * Purpose: `PEERS_NO_FORK_CODEMOD`, 0.23.0: test-only packages leave the peers and `react-dom` becomes a required
 *          peer.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 6edeee4.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Test-only packages are no longer peers; react-dom is a required peer. */
export const PEERS_NO_FORK_CODEMOD: UpgradeCodemod = {
  id: "peers-no-fork",
  version: "0.23.0",
  title: "Test-only packages are no longer peers; react-dom is a required peer",
  note: "@stackra/database's testing entry loads PGlite and its extensions, Faker and Testcontainers from the member running the tests: add the ones a member's tests use to its devDependencies. react-dom is a required peer of @stackra/ui, @stackra/app and @stackra/notifications: an app that uses them installs it. stackra validate refuses a test-only peer and an optional react-dom (forking-peers).",
  source: "6edeee4",
};
