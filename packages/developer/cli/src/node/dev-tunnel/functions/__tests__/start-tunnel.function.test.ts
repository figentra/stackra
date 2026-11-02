/**
 * Stackra file contract:
 * Purpose: unit tests of `startTunnel`: it refuses without the token, hands the token to `cloudflared` only in its
 *          environment and never on argv, removes it from the caller's environment, stops the child once, and reports
 *          an early exit without stopping anything else.
 * Boundary: test only; an injected spawn returns a fake child, so no `cloudflared` runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0290 (decisions 4 and 5).
 */
import type { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

import { describe, expect, it } from "@stackra/testing";

import { startTunnel } from "#node/dev-tunnel/functions/start-tunnel.function";
import { CliUsageError } from "#node/errors/cli-usage.error";
import { captureIo } from "#node/functions/capture-io.function";

/** A spawn that records its call and returns a child that only records `kill`. */
function fakeSpawn() {
  const calls: { command: string; args: readonly string[]; env: NodeJS.ProcessEnv }[] = [];
  const kills: string[] = [];
  const child = Object.assign(new EventEmitter(), {
    stdout: null,
    stderr: null,
    kill: (signal: string) => {
      kills.push(signal);
      return true;
    },
  });
  const spawnProcess = ((
    command: string,
    args: readonly string[],
    options: { env: NodeJS.ProcessEnv },
  ) => {
    calls.push({ command, args, env: options.env });
    return child;
  }) as unknown as typeof spawn;
  return { spawnProcess, calls, kills, child };
}

describe("startTunnel", () => {
  it("refuses without the token, naming it and how to start", () => {
    const { io } = captureIo();
    const { spawnProcess, calls } = fakeSpawn();
    expect(() => startTunnel({ PATH: "/bin" }, io, spawnProcess)).toThrow(CliUsageError);
    expect(() => startTunnel({ CLOUDFLARE_TUNNEL_TOKEN: "" }, io, spawnProcess)).toThrow(
      /CLOUDFLARE_TUNNEL_TOKEN.*infisical run --env=dev --path=\/agents/,
    );
    expect(calls).toHaveLength(0);
  });

  it("passes the token only as TUNNEL_TOKEN in the child's environment and removes it from the caller's", () => {
    const { io, output } = captureIo();
    const { spawnProcess, calls } = fakeSpawn();
    const env: NodeJS.ProcessEnv = { PATH: "/bin", CLOUDFLARE_TUNNEL_TOKEN: "tunnel-token-canary" };
    startTunnel(env, io, spawnProcess);

    expect(calls).toHaveLength(1);
    const [call] = calls;
    expect(call?.command).toBe("cloudflared");
    expect(call?.args).toEqual(["tunnel", "--no-autoupdate", "run"]);
    expect(call?.args.join(" ")).not.toContain("tunnel-token-canary");
    expect(call?.env["TUNNEL_TOKEN"]).toBe("tunnel-token-canary");
    expect(call?.env["CLOUDFLARE_TUNNEL_TOKEN"]).toBeUndefined();
    expect(call?.env["PATH"]).toBe("/bin");
    expect(env["CLOUDFLARE_TUNNEL_TOKEN"]).toBeUndefined();
    expect(output()).not.toContain("tunnel-token-canary");
  });

  it("stops the child once, and says nothing when it closes after stop", () => {
    const { io, output } = captureIo();
    const { spawnProcess, kills, child } = fakeSpawn();
    const tunnel = startTunnel({ CLOUDFLARE_TUNNEL_TOKEN: "t" }, io, spawnProcess);
    tunnel.stop();
    tunnel.stop();
    child.emit("close", null);
    expect(kills).toEqual(["SIGTERM"]);
    expect(output()).not.toContain("dev tunnel stopped");
  });

  it("reports a tunnel that exits on its own, and a cloudflared that cannot start", () => {
    const { io, output } = captureIo();
    const { spawnProcess, kills, child } = fakeSpawn();
    startTunnel({ CLOUDFLARE_TUNNEL_TOKEN: "t" }, io, spawnProcess);
    child.emit("error", new Error("spawn cloudflared ENOENT"));
    child.emit("close", 1);
    expect(output()).toContain("cannot start cloudflared: spawn cloudflared ENOENT");
    expect(output()).toContain("the dev tunnel stopped (cloudflared exited 1)");
    expect(kills).toEqual([]);
  });
});
