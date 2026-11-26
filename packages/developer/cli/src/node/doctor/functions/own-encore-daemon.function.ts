/**
 * Stackra file contract:
 * Purpose: `ownEncoreDaemon(port, probes?)`, whether the listener on `port` is the current user's own Encore daemon
 *          (its development dashboard, which `encore run` reuses), so `stackra dev` and `stackra doctor` can accept it
 *          instead of reporting the port in use. All three must hold: the listener belongs to the current user, the
 *          user's daemon answers on its own socket, and `GET /` on the port is the Encore development dashboard. The
 *          port number alone never counts, and another user's daemon on the same port does not either.
 * Boundary: read-only probes (see `encoreDaemonProbes`); stops at the first that fails.
 * Runtime: node
 * Governing contract: STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */
import { encoreDaemonProbes } from "#node/doctor/functions/encore-daemon-probes.function";
import { isEncoreDashboard } from "#node/doctor/functions/is-encore-dashboard.function";
import type { EncoreDaemonProbes } from "#node/doctor/types/encore-daemon-probes.type";

/**
 * Whether `port` is held by the current user's Encore daemon.
 *
 * @param port - the busy port (Encore's dashboard port).
 * @param probes - the reads to combine; the real ones by default.
 * @example
 * if (await ownEncoreDaemon(9400)) reuse();
 */
export async function ownEncoreDaemon(
  port: number,
  probes: EncoreDaemonProbes = encoreDaemonProbes(),
): Promise<boolean> {
  if (!(await probes.listenerIsMine(port))) return false;
  if (!(await probes.daemonAnswers())) return false;
  const answer = await probes.dashboard(port);
  return answer !== undefined && isEncoreDashboard(answer.status, answer.body);
}
