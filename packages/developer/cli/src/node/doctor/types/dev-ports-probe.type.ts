/**
 * Stackra file contract:
 * Purpose: `DevPortsProbe`, the two reads behind the "dev ports free" line (`devPortsResult`, `doctorChecks`): whether a
 *          port is free, and whether a busy port is the current user's own Encore daemon.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-019; STA-2794 (the user's own Encore daemon is reused).
 */

/** The reads behind the dev-ports line; `portFree` and `ownEncoreDaemon` are the real ones, a test passes fakes. */
export type DevPortsProbe = {
  /** Whether nothing listens on `port` on this machine. */
  readonly portFree: (port: number) => Promise<boolean>;

  /** Whether the listener on `port` is the current user's own Encore daemon. */
  readonly ownEncoreDaemon: (port: number) => Promise<boolean>;
};
