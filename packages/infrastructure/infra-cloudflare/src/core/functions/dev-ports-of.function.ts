/**
 * Stackra file contract:
 * Purpose: `devPortsOf(runways)`, each member's dev port from its runway (`environments.dev.port`), the one place a
 *          port is written; the input `tunnelIngress` needs.
 * Boundary: pure; reading the runway files is `readRunway`'s (`@stackra/runway/node`). A member without a dev port is
 *           left out. Lane offsets are `stackra dev`'s and never reach a tunnel.
 * Runtime: isomorphic
 * Governing contract: ADR 0290 (decision 4: ingress from the ports in runway.yaml), ADR 0296 (decision 1), ADR 0170
 *                     (dev ports written once).
 */
import type { AppRunway, ServiceRunway } from "@stackra/runway";

/**
 * Member → its dev port.
 *
 * @param runways - member key → its parsed member runway.
 * @example
 * devPortsOf({ console: readRunway("apps/console/runway.yaml", "app") }); // { console: 5173 }
 */
export function devPortsOf(
  runways: Readonly<Record<string, AppRunway | ServiceRunway>>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(runways).flatMap(([member, runway]) => {
      const port = runway.environments.dev?.port;
      return port === undefined ? [] : [[member, port] as const];
    }),
  );
}
