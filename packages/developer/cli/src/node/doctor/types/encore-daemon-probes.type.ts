/**
 * Stackra file contract:
 * Purpose: `EncoreDaemonProbes`, the three reads `ownEncoreDaemon` combines to tell the current user's own Encore
 *          daemon from any other process on its dashboard port.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */

/** The reads behind `ownEncoreDaemon`; `encoreDaemonProbes()` gives the real ones, a test passes fakes. */
export type EncoreDaemonProbes = {
  /** Whether every listener on `port` belongs to the current user (and there is one). */
  readonly listenerIsMine: (port: number) => Promise<boolean>;

  /** Whether the current user's Encore daemon accepts a connection on its own socket. */
  readonly daemonAnswers: () => Promise<boolean>;

  /** The answer to `GET /` on `port` of this machine; `undefined` when none came in time. */
  readonly dashboard: (
    port: number,
  ) => Promise<{ readonly status: number; readonly body: string } | undefined>;
};
