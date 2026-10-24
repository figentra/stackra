/**
 * Stackra file contract:
 * Purpose: `devPorts(member)`, a member's dev origin, port and host and its Electron dev ports (remote debugging, the
 *          PKCE loopback) from the runway facts: what the generated Electron entry loads in an unpackaged build.
 * Boundary: dev only; the generated entry calls it only when `app.isPackaged` is false. No port is typed anywhere
 *           but the member runway.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0251 (the desktop target), ADR 0295 (decision 7: generated entries).
 */
import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { memberFacts } from "#core/functions/member-facts.function";
import type { DevPorts } from "#core/types/dev-ports.type";

/**
 * The member's dev ports.
 *
 * @param member - the member key (`console`).
 * @throws RunwayUnresolvedError when there are no facts, the member is absent, or it has no dev server.
 * @example
 * const dev = electron.isPackaged ? null : devPorts("console");
 * createApp({ dev: dev && { url: dev.url, ...dev.desktop } });
 */
export function devPorts(member: string): DevPorts {
  const { member: entry } = memberFacts(member);
  if (entry.url === undefined || entry.port === undefined || entry.host === undefined) {
    throw new RunwayUnresolvedError(
      `"${member}" has no dev server in the runway facts: give its runway.yaml environments.dev a port`,
    );
  }
  return { url: entry.url, port: entry.port, host: entry.host, desktop: entry.desktop };
}
