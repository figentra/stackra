/**
 * Stackra file contract:
 * Purpose: `devServer(member)`, the Vite `server` block of a member from the dev facts `stackra dev` wrote (its
 *          runway's `environments.dev` port, host, https and open, lane offsets applied), with a strict port and HMR
 *          on the next port: the generated Vite configs' `server`, so no port is typed in a tool config.
 * Boundary: reads the dev facts and, for https, the TLS files they name; never writes.
 * Runtime: node
 * Governing contract: ADR 0296 (decision 1), ADR 0295 (decision 5: generated tool configs).
 */
import { readFileSync } from "node:fs";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { memberFacts } from "#core/functions/member-facts.function";
import type { DevServerOptions } from "#node/types/dev-server-options.type";

/**
 * The member's Vite dev server block.
 *
 * @param member - the member key (`web`, `console`).
 * @throws RunwayUnresolvedError when there are no dev facts, the member is absent or has no dev port, or it serves
 *         https without the TLS files.
 * @example
 * stackra.viteConfig(app, { server: devServer("console") }); // { port: 5173, host: "localhost", strictPort: true, … }
 */
export function devServer(member: string): DevServerOptions {
  const { member: entry } = memberFacts(member);
  if (entry.port === undefined || entry.host === undefined) {
    throw new RunwayUnresolvedError(
      `"${member}" has no dev server in the runway facts: give its runway.yaml environments.dev a port`,
    );
  }
  const options: DevServerOptions = {
    port: entry.port,
    host: entry.host,
    strictPort: true,
    open: entry.open,
    hmr: { port: entry.port + 1 },
  };
  if (!entry.https) return options;
  if (entry.tls === undefined) {
    throw new RunwayUnresolvedError(
      `"${member}" serves https in dev, but the dev facts name no TLS files: turn on the root runway's ` +
        "environments.dev.https so `stackra dev` makes them",
    );
  }
  return {
    ...options,
    https: { cert: readFileSync(entry.tls.cert), key: readFileSync(entry.tls.key) },
  };
}
