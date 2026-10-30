/**
 * Stackra file contract:
 * Purpose: unit tests of `runTestbed` with fake processes: the nested-call refusal, a light job on a free box,
 *          another box on exit 75, a light job retried once after a lost box, `--no-wait`, the fallback dispatch, and
 *          that the fallback input is the preset and the ref only.
 * Boundary: test only; nothing starts a process or reaches the network, the claim folder is a throwaway directory.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";

import { captureIo } from "#node/functions/capture-io.function";
import { runTestbed } from "#node/functions/run-testbed.function";
import type { TestbedDeps } from "#node/types/testbed-deps.type";
import type { TestbedRequest } from "#node/types/testbed-request.type";

let claimRoot: string;

beforeEach(() => {
  claimRoot = mkdtempSync(join(tmpdir(), "stackra-testbed-"));
});

afterEach(() => {
  rmSync(claimRoot, { recursive: true, force: true });
});

const instances = (...rows: [string, string, string][]) =>
  JSON.stringify(rows.map(([id, group, launch]) => ({ id, ip: `ip-${id}`, group, launch })));

type Fake = {
  readonly deps: TestbedDeps;
  readonly calls: string[];
  readonly streams: string[];
};

/** `agent` answers the remote command of one ssh call; `jobRun` answers the streamed `job run`, in order. */
function fake(options: {
  readonly boxes: string;
  readonly agent?: (box: string, command: string) => { code: number; stdout: string };
  readonly jobRun?: number[];
}): Fake {
  const calls: string[] = [];
  const streams: string[] = [];
  const jobRun = [...(options.jobRun ?? [0])];
  const deps: TestbedDeps = {
    exec: async (command, args) => {
      calls.push(`${command} ${args.join(" ")}`);
      if (command === "aws" && args.includes("describe-instances")) {
        return { code: 0, stdout: options.boxes, stderr: "" };
      }
      if (command === "ssh") {
        const box = String(args.at(-2)).split("@")[1] ?? "";
        const remote = String(args.at(-1));
        const answer = options.agent?.(box, remote) ?? defaultAgent(remote);
        return { ...answer, stderr: "" };
      }
      return { code: 0, stdout: "", stderr: "" };
    },
    stream: async (command, args) => {
      streams.push(`${command} ${args.join(" ")}`);
      if (command === "ssh" && String(args.at(-1)).includes("job run")) return jobRun.shift() ?? 0;
      return 0;
    },
    sleep: async () => undefined,
    now: () => 1_000_000,
    pid: 42,
    isAlive: () => true,
    publicIp: async () => undefined,
    claimRoot,
  };
  return { deps, calls, streams };
}

const defaultAgent = (remote: string) =>
  remote.includes("job prepare")
    ? { code: 0, stdout: "/data/jobs/x/app\n" }
    : remote.includes("health")
      ? { code: 0, stdout: "healthy" }
      : { code: 0, stdout: "free" };

const request = (overrides: Partial<TestbedRequest>): TestbedRequest => ({
  verb: "run",
  args: ["me work", "/tmp/app", "pnpm lint"],
  cwd: "/tmp",
  box: undefined,
  slot: undefined,
  preset: undefined,
  ref: undefined,
  noWait: false,
  settings: { profile: "p", region: "r", key: "/k", user: "ubuntu" },
  ...overrides,
});

describe("runTestbed run", () => {
  it("refuses a command that calls ci-box or stackra testbed with exit 2", async () => {
    const { deps, streams } = fake({ boxes: "[]" });
    const { io, output } = captureIo();
    const code = await runTestbed(request({ args: ["w", "/tmp/app", "ci-box status"] }), deps, io);
    expect(code).toBe(2);
    expect(output()).toContain("must not call");
    expect(streams).toEqual([]);
  });

  it("prepares, rsyncs into the returned path and runs the job on a free box", async () => {
    const { deps, streams } = fake({ boxes: instances(["i-1", "light", "2026-10-30T00:00:00Z"]) });
    const { io } = captureIo();
    expect(await runTestbed(request({}), deps, io)).toBe(0);
    expect(streams[0]).toContain("rsync -az --delete");
    expect(streams[0]).toContain("ubuntu@ip-i-1:/data/jobs/x/app/");
    expect(streams[0]).toContain("--exclude node_modules");
    expect(streams[1]).toContain("testbed-agent job run");
    expect(streams[1]).toContain(" light 'me work' 'app' -- 'pnpm lint'");
  });

  it("picks another box when the first answers 75", async () => {
    const { deps, streams } = fake({
      boxes: instances(
        ["i-1", "light", "2026-10-30T00:00:00Z"],
        ["i-2", "light", "2026-10-30T01:00:00Z"],
      ),
      jobRun: [75, 0],
    });
    const { io } = captureIo();
    expect(await runTestbed(request({}), deps, io)).toBe(0);
    const runs = streams.filter((line) => line.includes("job run"));
    expect(runs[0]).toContain("ip-i-1");
    expect(runs[1]).toContain("ip-i-2");
  });

  it("retries a light job once after the connection drops, and a heavy job never", async () => {
    const boxes = instances(
      ["i-1", "heavy", "2026-10-30T00:00:00Z"],
      ["i-2", "heavy", "2026-10-30T01:00:00Z"],
    );
    const light = fake({ boxes, jobRun: [255, 0] });
    expect(await runTestbed(request({}), light.deps, captureIo().io)).toBe(0);
    const heavy = fake({ boxes, jobRun: [255, 0] });
    expect(
      await runTestbed(
        request({ args: ["w", "/tmp/app", "pnpm build"] }),
        heavy.deps,
        captureIo().io,
      ),
    ).toBe(255);
  });

  it("exits 75 with --no-wait when no box is healthy", async () => {
    const { deps } = fake({
      boxes: instances(["i-1", "light", "2026-10-30T00:00:00Z"]),
      agent: (_box, command) =>
        command.includes("health")
          ? { code: 1, stdout: "unhealthy: disk" }
          : { code: 0, stdout: "busy x" },
    });
    expect(await runTestbed(request({ noWait: true }), deps, captureIo().io)).toBe(75);
  });

  it("dispatches the fallback workflow with the preset and the ref only", async () => {
    const { deps, streams } = fake({ boxes: "[]" });
    const code = await runTestbed(
      request({ preset: "verify", ref: "feat/x" }),
      deps,
      captureIo().io,
    );
    expect(code).toBe(0);
    expect(streams).toEqual(["gh workflow run testbed-fallback.yml --ref feat/x -f preset=verify"]);
  });
});
