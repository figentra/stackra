/**
 * Stackra file contract:
 * Purpose: unit tests of `createTestbedDeps`: processes run in `cwd` through `runCaptured` and `runProcess`; a pid is alive unless the
 *          kill probe says it does not exist (EPERM still counts as alive); the public IP is the trimmed answer of checkip when it is
 *          an address and `undefined` otherwise; interrupt handlers attach to SIGINT and SIGTERM once and detach again; the Session
 *          Manager plugin is accepted on `PATH`, else found through `mise which`, else through mise's install folder (whose folder is
 *          then put first on `PATH`), else the setup message is returned.
 * Boundary: test only; the process helpers, `fetch`, `process.kill` and the existence of the plugin file are fakes; `PATH` is restored.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0484; ADR 0282 (decision 3).
 */
import { delimiter, join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { createTestbedDeps } from "#node/functions/create-testbed-deps.function";
import { runCaptured } from "#node/functions/run-captured.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliIo } from "#node/types/cli-io.type";

const files = vi.hoisted(() => ({ present: new Set<string>() }));

vi.mock("node:fs", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  existsSync: (path: string) => files.present.has(path),
}));
vi.mock("#node/functions/run-captured.function", () => ({ runCaptured: vi.fn() }));
vi.mock("#node/functions/run-process.function", () => ({ runProcess: vi.fn() }));

const io: CliIo = { out: () => undefined, err: () => undefined, inherit: false };
const PLUGIN = "session-manager-plugin";
const ok = (stdout = "") => ({ code: 0, stdout, stderr: "" });
const failed = { code: 1, stdout: "", stderr: "" };

let originalPath: string | undefined;
let originalMiseData: string | undefined;

beforeEach(() => {
  originalPath = process.env["PATH"];
  originalMiseData = process.env["MISE_DATA_DIR"];
  process.env["MISE_DATA_DIR"] = "/mise";
  files.present.clear();
  vi.mocked(runCaptured).mockReset();
  vi.mocked(runProcess).mockReset();
});

afterEach(() => {
  process.env["PATH"] = originalPath;
  if (originalMiseData === undefined) delete process.env["MISE_DATA_DIR"];
  else process.env["MISE_DATA_DIR"] = originalMiseData;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createTestbedDeps processes", () => {
  it("runs exec in cwd with the timeout, and streams in cwd to the given io", async () => {
    vi.mocked(runCaptured).mockResolvedValue(ok("out"));
    vi.mocked(runProcess).mockResolvedValue(3);
    const deps = createTestbedDeps("/repo", io);

    expect(await deps.exec("aws", ["sts"], { timeoutMs: 900 })).toEqual(ok("out"));
    expect(runCaptured).toHaveBeenCalledWith("aws", ["sts"], "/repo", 900);
    await deps.exec("aws", []);
    expect(runCaptured).toHaveBeenLastCalledWith("aws", [], "/repo", undefined);

    expect(await deps.stream("ssh", ["box"])).toBe(3);
    expect(runProcess).toHaveBeenCalledWith({ command: "ssh", args: ["box"], cwd: "/repo" }, io);
  });

  it("offers the claim folder, this pid and the clock", () => {
    const deps = createTestbedDeps("/repo", io);
    expect(deps.claimRoot).toBe("/tmp/ci-claim");
    expect(deps.pid).toBe(process.pid);
    expect(Math.abs(deps.now() - Date.now())).toBeLessThan(1000);
  });

  it("sleeps for the time given", async () => {
    vi.useFakeTimers();
    try {
      let woke = false;
      const sleeping = createTestbedDeps("/repo", io)
        .sleep(5000)
        .then(() => {
          woke = true;
        });
      await vi.advanceTimersByTimeAsync(4999);
      expect(woke).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await sleeping;
      expect(woke).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("createTestbedDeps isAlive", () => {
  it("is true for a live process, true for one that is not ours (EPERM) and false for one that is gone (ESRCH)", () => {
    const deps = createTestbedDeps("/repo", io);
    expect(deps.isAlive(process.pid)).toBe(true);
    const kill = vi.spyOn(process, "kill");
    kill.mockImplementationOnce(() => {
      throw Object.assign(new Error("no permission"), { code: "EPERM" });
    });
    expect(deps.isAlive(1)).toBe(true);
    kill.mockImplementationOnce(() => {
      throw Object.assign(new Error("no such process"), { code: "ESRCH" });
    });
    expect(deps.isAlive(999_999)).toBe(false);
    expect(kill).toHaveBeenCalledWith(999_999, 0);
  });
});

const answer = (body: string) =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ text: async () => body })),
  );

describe("createTestbedDeps publicIp", () => {
  it("is the trimmed address checkip answers", async () => {
    answer("203.0.113.7\n");
    expect(await createTestbedDeps("/repo", io).publicIp()).toBe("203.0.113.7");
    expect(fetch).toHaveBeenCalledWith(
      "https://checkip.amazonaws.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("is undefined for an answer that is not an address, and when the request fails", async () => {
    answer("<html>captive portal</html>");
    expect(await createTestbedDeps("/repo", io).publicIp()).toBeUndefined();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await createTestbedDeps("/repo", io).publicIp()).toBeUndefined();
  });
});

const counts = (): number[] => [process.listenerCount("SIGINT"), process.listenerCount("SIGTERM")];

describe("createTestbedDeps onInterrupt", () => {
  it("attaches the handler to SIGINT and SIGTERM and detaches both", () => {
    const before = counts();
    const handler = vi.fn();
    const off = createTestbedDeps("/repo", io).onInterrupt(handler);
    expect(counts()).toEqual(before.map((count) => count + 1));

    process.emit("SIGTERM");
    expect(handler).toHaveBeenCalledTimes(1);

    off();
    expect(counts()).toEqual(before);
  });
});

describe("createTestbedDeps ssmPlugin", () => {
  const miseFolder = join(
    "/mise",
    "installs",
    "aqua-aws-session-manager-plugin",
    "latest",
    "sessionmanager-bundle",
    "bin",
  );

  it("accepts a plugin that already runs from PATH and leaves PATH alone", async () => {
    vi.mocked(runCaptured).mockResolvedValue(ok("1.2.0"));
    process.env["PATH"] = "/usr/bin";
    expect(await createTestbedDeps("/repo", io).ssmPlugin()).toBeUndefined();
    expect(runCaptured).toHaveBeenCalledWith(PLUGIN, ["--version"], "/repo");
    expect(runCaptured).toHaveBeenCalledTimes(1);
    expect(process.env["PATH"]).toBe("/usr/bin");
  });

  it("finds the copy `mise which` names and puts its folder first on PATH", async () => {
    process.env["PATH"] = "/usr/bin";
    files.present.add(join("/somewhere/mise/bin", PLUGIN));
    vi.mocked(runCaptured).mockImplementation(async (command) => {
      if (command === "mise") return ok("/somewhere/mise/bin/session-manager-plugin\n");
      return (process.env["PATH"] ?? "").startsWith("/somewhere/mise/bin") ? ok("1.2.0") : failed;
    });
    expect(await createTestbedDeps("/repo", io).ssmPlugin()).toBeUndefined();
    expect(process.env["PATH"]).toBe(["/somewhere/mise/bin", "/usr/bin"].join(delimiter));
  });

  it("falls back to mise's install folder when `mise which` finds nothing", async () => {
    process.env["PATH"] = "/usr/bin";
    files.present.add(join(miseFolder, PLUGIN));
    vi.mocked(runCaptured).mockImplementation(async (command) => {
      if (command === "mise") return failed;
      return (process.env["PATH"] ?? "").startsWith(miseFolder) ? ok("1.2.0") : failed;
    });
    expect(await createTestbedDeps("/repo", io).ssmPlugin()).toBeUndefined();
    expect(process.env["PATH"]).toBe([miseFolder, "/usr/bin"].join(delimiter));
  });

  it("returns the setup message, with PATH changed only for a folder that exists, when the plugin cannot be found or run", async () => {
    process.env["PATH"] = "/usr/bin";
    vi.mocked(runCaptured).mockResolvedValue(undefined);
    const message = await createTestbedDeps("/repo", io).ssmPlugin();
    expect(message).toContain("Session Manager plugin is not on PATH");
    expect(message).toContain("mise install");
    expect(message).toContain("--ssh-direct");
    expect(process.env["PATH"]).toBe("/usr/bin");

    // A file is there, but it still does not run: the message is still returned.
    files.present.add(join(miseFolder, PLUGIN));
    vi.mocked(runCaptured).mockResolvedValue(failed);
    expect(await createTestbedDeps("/repo", io).ssmPlugin()).toContain("Session Manager plugin");
  });
});
