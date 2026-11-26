/**
 * Stackra file contract:
 * Purpose: `devPortsResult(ports, reusable, probe)`, the "dev ports free" line of `stackra doctor` (and of the quick
 *          doctor `stackra dev` runs): it fails on a busy port, except a `reusable` port (Encore's dashboard port)
 *          held by the current user's own Encore daemon, which `encore run` reuses, so a second `stackra dev` starts
 *          while the daemon from the first one still runs. `undefined` when there is no port to check.
 * Boundary: reads only through `probe` (binding a port, `ownEncoreDaemon`); changes nothing.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-019; STA-2794 (a second `stackra dev` reuses the user's own Encore daemon).
 */
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";

/**
 * The dev-ports line.
 *
 * @param ports - the ports `stackra dev` will listen on, Encore's included.
 * @param reusable - the ports the user's own Encore daemon may already hold (Encore's dashboard port).
 * @param probe - `portFree` binds the port to see whether it is free; `ownEncoreDaemon` tells the user's own daemon.
 * @example
 * const line = await devPortsResult([4000, 9400], [9400], { portFree, ownEncoreDaemon });
 */
export async function devPortsResult(
  ports: readonly number[],
  reusable: readonly number[],
  probe: {
    readonly portFree: (port: number) => Promise<boolean>;
    readonly ownEncoreDaemon: (port: number) => Promise<boolean>;
  },
): Promise<DoctorResult | undefined> {
  if (ports.length === 0) return undefined;
  const busy: number[] = [];
  const reused: number[] = [];
  for (const port of new Set(ports)) {
    if (await probe.portFree(port)) continue;
    if (reusable.includes(port) && (await probe.ownEncoreDaemon(port))) reused.push(port);
    else busy.push(port);
  }
  return {
    name: "dev ports free",
    status: busy.length ? "fail" : "ok",
    detail:
      [
        busy.length ? `in use: ${busy.join(", ")}` : "",
        reused.length ? `your Encore daemon holds ${reused.join(", ")} (reused)` : "",
      ]
        .filter(Boolean)
        .join("; ") || undefined,
    fix: `stop what listens there (lsof -nP -iTCP:${busy[0] ?? ports[0]} -sTCP:LISTEN)`,
  };
}
