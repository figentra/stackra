/**
 * Stackra file contract:
 * Purpose: `npxCommand(host)`, how to start npm's `npx` without a shell: the `npx-cli.js` of the npm that ships with
 *          the running Node (beside `node.exe` on Windows, in `../lib/node_modules/npm` elsewhere), else the one beside
 *          `npm_execpath` (set when npm runs the initializer), run by this Node; else the `npx` on the PATH, except on
 *          Windows, where a `.cmd` cannot start without a shell and the answer is undefined.
 * Boundary: pure apart from `host.exists`; starts nothing.
 * Runtime: node
 * Governing contract: ADR 0199 (amendment of 2026-11-27).
 */
import { dirname, join } from "node:path";

import type { BootstrapHost } from "#node/types/bootstrap-host.type";
import type { NpxCommand } from "#node/types/npx-command.type";

/**
 * How to start npx on this host.
 *
 * @param host - the environment, Node binary, platform and file probe.
 * @example
 * npxCommand(PROCESS_HOST); // { command: "/usr/local/bin/node", args: ["/usr/local/lib/node_modules/npm/bin/npx-cli.js"] }
 */
export function npxCommand(
  host: Pick<BootstrapHost, "env" | "execPath" | "platform" | "exists">,
): NpxCommand | undefined {
  const nodeDir = dirname(host.execPath);
  const npmExec = host.env["npm_execpath"];
  const candidates = [
    host.platform === "win32"
      ? join(nodeDir, "node_modules", "npm", "bin", "npx-cli.js")
      : join(nodeDir, "..", "lib", "node_modules", "npm", "bin", "npx-cli.js"),
    ...(npmExec?.endsWith("npm-cli.js") ? [join(dirname(npmExec), "npx-cli.js")] : []),
  ];
  const script = candidates.find((path) => host.exists(path));
  if (script !== undefined) return { command: host.execPath, args: [script] };
  return host.platform === "win32" ? undefined : { command: "npx", args: [] };
}
