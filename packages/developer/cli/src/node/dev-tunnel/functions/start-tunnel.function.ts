/**
 * Stackra file contract:
 * Purpose: `startTunnel(env, io, spawnProcess)`, the tunnel half of `stackra dev --tunnel`: takes the developer
 *          machine's tunnel token from `env`, removes it there so the member's dev processes never inherit it, and
 *          starts `cloudflared tunnel run` with the token in that one child's environment.
 * Boundary: never puts the token on a command line, in a file or in output; refuses with a usage error when the token is
 *           missing. The tunnel and its hosts exist in Cloudflare already (ADR 0290 decision 5), so it passes no
 *           config. A tunnel that exits while the dev run goes on is reported on `io.err`, and the dev run is left alone.
 * Runtime: node
 * Governing contract: ADR 0290 (decisions 4 and 5); ADR 0173 (secrets by name only).
 */
import { spawn } from "node:child_process";

import { DEV_TUNNEL_SETTINGS } from "#node/dev-tunnel/constants/dev-tunnel-settings.constant";
import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliIo } from "#node/types/cli-io.type";
import type { DevTunnel } from "#node/dev-tunnel/types/dev-tunnel.type";

/**
 * Starts the developer machine's tunnel.
 *
 * @param env - the environment the token is read from and removed from (the CLI's own, `process.env`).
 * @param io - where the tunnel's output and an early exit are written.
 * @param spawnProcess - `child_process.spawn`, replaced in tests.
 * @throws CliUsageError when the token is not in `env`.
 * @example
 * const tunnel = startTunnel(process.env, io);
 * try { return await runDev(); } finally { tunnel.stop(); }
 */
export function startTunnel(
  env: NodeJS.ProcessEnv,
  io: CliIo,
  spawnProcess: typeof spawn = spawn,
): DevTunnel {
  const { tokenVariable, cloudflaredTokenVariable, command, args } = DEV_TUNNEL_SETTINGS;
  const token = env[tokenVariable];
  if (token === undefined || token === "")
    throw new CliUsageError(
      `--tunnel needs ${tokenVariable} (this machine's tunnel token): start it through ` +
        "`infisical run --env=dev --path=/agents -- stackra dev --tunnel`",
    );
  Reflect.deleteProperty(env, tokenVariable);

  const child = spawnProcess(command, [...args], {
    env: { ...env, [cloudflaredTokenVariable]: token },
    stdio: io.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  child.stdout?.setEncoding("utf8").on("data", io.out);
  child.stderr?.setEncoding("utf8").on("data", io.err);
  let stopping = false;
  child.on("error", (error) => io.err(`stackra: cannot start ${command}: ${error.message}\n`));
  child.on("close", (code) => {
    if (!stopping)
      io.err(`stackra: the dev tunnel stopped (${command} exited ${code ?? "by signal"})\n`);
  });
  return {
    stop() {
      if (stopping) return;
      stopping = true;
      child.kill("SIGTERM");
    },
  };
}
