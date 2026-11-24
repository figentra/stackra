/**
 * Stackra file contract:
 * Purpose: hold `doctorChecks` to its contract on a fake machine: mise and its tools, the Docker engine and the dev ports
 *          (a quick run stops there), then the install, disk, network and registry rows, the GitHub login, and the rows each
 *          need adds (the Encore CLI, pulumi, Xcode and a simulator, the agent tools, and the sops login and secrets clone
 *          of a repository whose scripts run `secrets-exec`); `fresh` skips the rows a new app cannot pass yet.
 * Boundary: test only; commands, ports, files, the disk and the network are stubs, so nothing is run, bound or read.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (testing strategy); STA-1952 spec User Story 0.
 */
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { DOCTOR_HOSTS } from "#node/doctor/constants/doctor-hosts.constant";
import { doctorChecks } from "#node/doctor/functions/doctor-checks.function";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";

/** The fake machine: what is installed and what each command answers, which ports are busy, which files exist. */
const machine = vi.hoisted(() => ({
  commands: new Map<string, { status: number | null; stdout?: string }>(),
  installed: new Set<string>(),
  busyPorts: new Set<number>(),
  files: new Set<string>(),
  freeBytes: undefined as number | undefined,
  probes: [] as { host: string; address: string; ok: boolean }[],
  calls: [] as string[],
}));

vi.mock("node:child_process", () => ({
  spawnSync: (command: string, args: string[]) => {
    const line = [command, ...args].join(" ");
    machine.calls.push(line);
    if (command === "which")
      return { status: machine.installed.has(args[0] ?? "") ? 0 : 1, stdout: "" };
    const answer = machine.commands.get(line) ??
      [...machine.commands].find(([key]) => line.startsWith(key))?.[1] ?? { status: null };
    return {
      status: answer.status,
      stdout: answer.stdout ?? "",
      ...(answer.status === null ? { error: new Error("ENOENT") } : {}),
    };
  },
}));

vi.mock("node:fs", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  existsSync: (path: string) => machine.files.has(path),
  statfsSync: () => {
    if (machine.freeBytes === undefined) throw new Error("no statfs");
    return { bavail: machine.freeBytes, bsize: 1 };
  },
}));

vi.mock("node:net", () => ({
  createServer: () => {
    let onError: (() => void) | undefined;
    return {
      once: (_event: string, listener: () => void) => {
        onError = listener;
      },
      listen: (port: number, ready: () => void) =>
        machine.busyPorts.has(port) ? onError?.() : ready(),
      close: (done: () => void) => done(),
    };
  },
}));

vi.mock("node:os", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  homedir: () => "/home/dev",
}));

vi.mock("#node/doctor/functions/probe-hosts.function", () => ({
  probeHosts: async () => machine.probes,
}));

const GB = 1024 ** 3;

/** Every base host answering, as a healthy network looks. */
const answering = () =>
  (DOCTOR_HOSTS.base ?? []).map((host) => ({ host, address: "10.0.0.1", ok: true }));
const ROOT = "/repo";

/** A workspace asking for nothing beyond the base rows. */
const PLAIN: DoctorWorkspace = { manifests: [], scripts: {}, devPorts: [] };

/** A service member, which adds the `services` need. */
const SERVICE = { stackra: { tier: "service", runtimes: ["node"] } };

/** The result called `name`. */
const row = async (workspace: DoctorWorkspace, name: string, options = {}) =>
  (await doctorChecks(ROOT, workspace, options)).find((result) => result.name === name);

/** A machine where mise, docker, gh and the registry all answer. */
function healthy(): void {
  for (const tool of ["mise", "gh", "docker", "encore", "pulumi"]) machine.installed.add(tool);
  machine.commands.set("mise ls --current --json", { status: 0, stdout: "{}" });
  machine.commands.set("docker info", { status: 0, stdout: '{"ServerVersion":"27.0"}' });
  machine.commands.set("pnpm view", { status: 0 });
  machine.commands.set("gh auth status", { status: 0 });
  machine.freeBytes = 50 * GB;
  machine.probes = answering();
  machine.files.add(`${ROOT}/node_modules/.modules.yaml`);
}

beforeEach(() => {
  machine.commands.clear();
  machine.installed.clear();
  machine.busyPorts.clear();
  machine.files.clear();
  machine.freeBytes = undefined;
  machine.probes = [];
  machine.calls = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("doctorChecks: mise", () => {
  it("fails when mise is not installed, naming the install", async () => {
    const result = await row(PLAIN, "mise installed");
    expect(result).toMatchObject({ status: "fail", detail: "not on PATH" });
    expect(result?.fix).toContain("https://mise.jdx.dev");
  });

  it("passes when every tool of mise.toml is installed", async () => {
    healthy();
    expect(await row(PLAIN, "mise tools")).toMatchObject({
      status: "ok",
      run: ["mise", "install"],
    });
  });

  it("names the tools mise has not installed", async () => {
    healthy();
    machine.commands.set("mise ls --current --json", {
      status: 0,
      stdout: JSON.stringify({
        node: [{ installed: true }],
        pnpm: [{ installed: false }],
        gh: [{}],
      }),
    });
    expect(await row(PLAIN, "mise tools")).toMatchObject({ status: "fail", detail: "pnpm, gh" });
  });

  it("keeps the `mise trust` hint when mise's output is unreadable", async () => {
    healthy();
    machine.commands.set("mise ls --current --json", {
      status: 1,
      stdout: "mise: untrusted config",
    });
    const result = await row(PLAIN, "mise tools");
    expect(result?.status).toBe("fail");
    expect(result?.detail).toContain("mise trust");
  });
});

describe("doctorChecks: Docker and the dev ports", () => {
  it("passes with a running engine, and fails for a stopped one and a missing CLI", async () => {
    healthy();
    const service = { ...PLAIN, manifests: [SERVICE] };
    expect(await row(service, "Docker engine running")).toMatchObject({ status: "ok" });
    machine.commands.set("docker info", { status: 1, stdout: "Cannot connect" });
    expect(await row(service, "Docker engine running")).toMatchObject({
      status: "fail",
      detail: "the docker CLI is installed but no engine answers",
      fix: "start OrbStack or Docker Desktop",
    });
    machine.commands.delete("docker info");
    expect((await row(service, "Docker engine running"))?.detail).toContain("no docker CLI");
  });

  it("asks nothing of Docker for a workspace without a service", async () => {
    healthy();
    expect(await row(PLAIN, "Docker engine running")).toBeUndefined();
  });

  it("checks Encore's ports for a service and the members' dev ports, listing the busy ones", async () => {
    healthy();
    machine.busyPorts.add(9400);
    machine.busyPorts.add(3710);
    const service = { ...PLAIN, manifests: [SERVICE], devPorts: [3710, 3711] };
    const result = await row(service, "dev ports free");
    expect(result).toMatchObject({ status: "fail", detail: "in use: 9400, 3710" });
    expect(result?.fix).toContain("lsof -nP -iTCP:9400");
  });

  it("passes when every port is free, and has no row when there is none to check", async () => {
    healthy();
    expect(await row({ ...PLAIN, devPorts: [3710] }, "dev ports free")).toMatchObject({
      status: "ok",
    });
    expect(await row(PLAIN, "dev ports free")).toBeUndefined();
  });

  it("a quick run stops after the ports", async () => {
    healthy();
    const names = (await doctorChecks(ROOT, { ...PLAIN, devPorts: [3710] }, { quick: true })).map(
      (r) => r.name,
    );
    expect(names).toEqual(["mise tools", "dev ports free"]);
  });
});

describe("doctorChecks: install, disk and network", () => {
  it("checks pnpm install, except for a fresh app that has none yet", async () => {
    healthy();
    expect(await row(PLAIN, "pnpm install done")).toMatchObject({
      status: "ok",
      run: ["pnpm", "install"],
    });
    machine.files.clear();
    expect(await row(PLAIN, "pnpm install done")).toMatchObject({ status: "fail" });
    expect(await row(PLAIN, "pnpm install done", { fresh: true })).toBeUndefined();
  });

  it("warns below 5 GB free, reports the free space, and has no row when the disk cannot be read", async () => {
    healthy();
    expect(await row(PLAIN, "disk space")).toMatchObject({ status: "ok", detail: "50.0 GB free" });
    machine.freeBytes = 2 * GB;
    expect(await row(PLAIN, "disk space")).toMatchObject({ status: "warn", detail: "2.0 GB free" });
    machine.freeBytes = undefined;
    expect(await row(PLAIN, "disk space")).toBeUndefined();
  });

  it("reports unreachable hosts as a failure and dropped addresses as a warning", async () => {
    healthy();
    expect((await row(PLAIN, "network"))?.status).toBe("ok");
    machine.probes = answering().filter((probe) => probe.host !== "nodejs.org");
    expect(await row(PLAIN, "network")).toMatchObject({ status: "fail" });
    expect((await row(PLAIN, "network"))?.detail).toContain("unreachable: ");
    machine.probes = [...answering(), { host: "github.com", address: "2.2.2.2", ok: false }];
    const dropped = await row(PLAIN, "network");
    expect(dropped?.status).toBe("warn");
    expect(dropped?.detail).toContain("dropped while sibling addresses answer: github.com 2.2.2.2");
  });
});

describe("doctorChecks: registries and GitHub", () => {
  const withStackra: DoctorWorkspace = {
    ...PLAIN,
    manifests: [{ dependencies: { "@stackra/gen": "0.33.1" } }],
  };

  it("reads the @stackra registry through pnpm view, with the registry named explicitly", async () => {
    healthy();
    expect(await row(withStackra, "@stackra registry readable")).toMatchObject({ status: "ok" });
    expect(
      machine.calls.some((c) => c.startsWith("pnpm view @stackra/gen version --json --registry=")),
    ).toBe(true);
    machine.commands.set("pnpm view", { status: 1 });
    expect(await row(withStackra, "@stackra registry readable")).toMatchObject({ status: "fail" });
  });

  it("has no @stackra row for a workspace that depends on none, or only on workspace packages", async () => {
    healthy();
    expect(await row(PLAIN, "@stackra registry readable")).toBeUndefined();
    const linked = { ...PLAIN, manifests: [{ dependencies: { "@stackra/gen": "workspace:*" } }] };
    expect(await row(linked, "@stackra registry readable")).toBeUndefined();
  });

  it("warns, never fails, for GitHub: not installed, not signed in, signed in", async () => {
    healthy();
    expect(await row(PLAIN, "GitHub CLI signed in")).toMatchObject({ status: "ok" });
    machine.commands.set("gh auth status", { status: 1 });
    expect(await row(PLAIN, "GitHub CLI signed in")).toMatchObject({
      status: "warn",
      fix: "gh auth login",
    });
    machine.installed.delete("gh");
    expect(await row(PLAIN, "GitHub CLI signed in")).toMatchObject({
      status: "warn",
      detail: "gh not installed",
    });
  });

  it("checks the @figentra registry for a workspace that depends on it", async () => {
    healthy();
    const figentra = { ...PLAIN, manifests: [{ devDependencies: { "@figentra/cli": "1.0.0" } }] };
    expect(await row(figentra, "@figentra registry readable")).toMatchObject({ status: "ok" });
    machine.commands.set("pnpm view", { status: 1 });
    expect(await row(figentra, "@figentra registry readable")).toMatchObject({ status: "fail" });
  });
});

describe("doctorChecks: what each need adds", () => {
  it("wants the Encore CLI for a service and pulumi for AWS infrastructure", async () => {
    healthy();
    const needs = { ...PLAIN, manifests: [SERVICE], runway: { providers: { aws: {} } } };
    expect(await row(needs, "encore CLI")).toMatchObject({ status: "ok" });
    expect(await row(needs, "pulumi CLI")).toMatchObject({ status: "ok" });
    machine.installed.delete("encore");
    machine.installed.delete("pulumi");
    expect(await row(needs, "encore CLI")).toMatchObject({
      status: "fail",
      run: ["mise", "install"],
    });
    expect(await row(needs, "pulumi CLI")).toMatchObject({ status: "fail" });
  });

  it("wants Xcode's command-line tools and an available iOS simulator for a mobile member", async () => {
    healthy();
    const mobile = { ...PLAIN, manifests: [{ stackra: { runtimes: ["react-native"] } }] };
    machine.commands.set("xcode-select -p", { status: 0 });
    machine.commands.set("xcrun simctl list devices --json", {
      status: 0,
      stdout: JSON.stringify({
        devices: { "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [{ isAvailable: true }] },
      }),
    });
    expect(await row(mobile, "Xcode command-line tools")).toMatchObject({ status: "ok" });
    expect(await row(mobile, "iOS simulator")).toMatchObject({ status: "ok" });
    machine.commands.set("xcode-select -p", { status: 2 });
    machine.commands.set("xcrun simctl list devices --json", { status: 1, stdout: "not json" });
    expect(await row(mobile, "Xcode command-line tools")).toMatchObject({
      status: "fail",
      run: ["xcode-select", "--install"],
    });
    expect(await row(mobile, "iOS simulator")).toMatchObject({ status: "fail" });
  });
});

describe("doctorChecks: the agent tools", () => {
  const agents: DoctorWorkspace = { ...PLAIN, scripts: { "agents:check": "stackra agents:check" } };

  it("fails for an AWS CLI that is missing, and reads the bedrock identity without echoing it", async () => {
    healthy();
    expect(await row(agents, "aws bedrock profile")).toMatchObject({
      status: "fail",
      detail: "aws CLI not installed",
    });
    machine.installed.add("aws");
    machine.commands.set("aws sts get-caller-identity", {
      status: 0,
      stdout: '{"Account":"123456789012"}',
    });
    const ok = await row(agents, "aws bedrock profile");
    expect(ok).toMatchObject({ status: "ok" });
    expect(JSON.stringify(ok)).not.toContain("123456789012");
    machine.commands.set("aws sts get-caller-identity", { status: 255, stdout: "" });
    expect(await row(agents, "aws bedrock profile")).toMatchObject({ status: "fail" });
  });

  it("checks the claude and opencode CLIs, agents:check, and the rendered .mcp.json", async () => {
    healthy();
    machine.installed.add("claude");
    machine.commands.set("pnpm agents:check", { status: 0 });
    machine.files.add(`${ROOT}/.mcp.json`);
    expect(await row(agents, "claude CLI")).toMatchObject({ status: "ok" });
    expect(await row(agents, "opencode CLI")).toMatchObject({ status: "fail" });
    expect(await row(agents, "agents:check clean")).toMatchObject({ status: "ok" });
    expect(await row(agents, ".mcp.json present")).toMatchObject({ status: "ok" });
    machine.commands.set("pnpm agents:check", { status: 1 });
    machine.files.delete(`${ROOT}/.mcp.json`);
    expect(await row(agents, "agents:check clean")).toMatchObject({ status: "fail" });
    expect(await row(agents, ".mcp.json present")).toMatchObject({ status: "warn" });
    expect(await row(agents, "agents:check clean", { fresh: true })).toBeUndefined();
  });

  it("checks sops, the Google login and the secrets clone when a script runs secrets-exec", async () => {
    healthy();
    const secrets = {
      ...agents,
      scripts: { ...agents.scripts, linear: "node tools/scripts/secrets-exec.mjs -- node x" },
    };
    vi.stubEnv("STACKRA_SECRETS_DIR", "/secrets");
    vi.stubEnv("GOOGLE_APPLICATION_CREDENTIALS", "");
    vi.stubEnv("CLOUDSDK_CONFIG", "");
    machine.installed.add("sops");
    machine.files.add("/home/dev/.config/gcloud/application_default_credentials.json");
    machine.files.add("/secrets/agents");
    expect(await row(secrets, "sops CLI")).toMatchObject({ status: "ok" });
    expect(await row(secrets, "Google login for sops")).toMatchObject({
      status: "ok",
      detail: "gcloud not installed",
    });
    expect(await row(secrets, "figentra/secrets clone")).toMatchObject({
      status: "ok",
      detail: "/secrets",
    });
    machine.installed.delete("sops");
    machine.files.clear();
    expect(await row(secrets, "sops CLI")).toMatchObject({ status: "fail" });
    expect(await row(secrets, "Google login for sops")).toMatchObject({ status: "fail" });
    expect(await row(secrets, "figentra/secrets clone")).toMatchObject({ status: "fail" });
  });

  it("asks nothing about sops of an agents workspace whose scripts do not run secrets-exec", async () => {
    healthy();
    expect(await row(agents, "sops CLI")).toBeUndefined();
  });
});
