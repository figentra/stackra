/**
 * Stackra file contract:
 * Purpose: `doctorChecks(root, workspace, options?)`, the `stackra doctor` checklist of the workspace at `root`, in
 *          order: the base checks (mise tools, pnpm install, disk, network, GitHub), then one group per need
 *          `doctorNeeds` finds (Docker, Encore and the Encore ports; the `@stackra` and `@figentra` registry reads;
 *          Infisical; Pulumi; Xcode and a simulator; the agent tooling), then the members' dev ports. `quick` keeps only
 *          what `stackra dev` needs before it starts: mise tools, Docker and the ports. `fresh` is a workspace not
 *          written yet (`stackra create` checks a starter): no install and no agents:check.
 * Boundary: runs read-only status commands (`mise ls`, `docker info`, `gh auth status`, `pnpm view`, `xcode-select
 *           -p`, `xcrun simctl list`, `infisical profile list`, `aws sts get-caller-identity`), probes hosts and
 *           tries to bind ports; installs and changes nothing. Secrets: forbidden: output is parsed, never printed;
 *           the registry check reads only the exit status of a version lookup, so no token is read or shown.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121; STA-1952 spec FR-014 to FR-019; ADR 0515.
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { existsSync, statfsSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";

import { DOCTOR_HOSTS } from "#node/doctor/constants/doctor-hosts.constant";
import { awsIdentityOk } from "#node/doctor/functions/aws-identity-ok.function";
import { dockerState } from "#node/doctor/functions/docker-state.function";
import { doctorNeeds } from "#node/doctor/functions/doctor-needs.function";
import { droppedAddresses } from "#node/doctor/functions/dropped-addresses.function";
import { publishedDependency } from "#node/doctor/functions/published-dependency.function";
import { infisicalLoggedIn } from "#node/doctor/functions/infisical-logged-in.function";
import { missingMiseTools } from "#node/doctor/functions/missing-mise-tools.function";
import { probeHosts } from "#node/doctor/functions/probe-hosts.function";
import { simulatorAvailable } from "#node/doctor/functions/simulator-available.function";
import type { DoctorNeed } from "#node/doctor/types/doctor-need.type";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";
import type { DoctorWorkspace } from "#node/doctor/types/doctor-workspace.type";
import { registryOrigin } from "#node/functions/registry-origin.function";

/** Encore's local API and its development dashboard. */
const ENCORE_PORTS = [4000, 9400];

/** Below this much free disk, an install or an image pull may fail. */
const MIN_FREE_BYTES = 5 * 1024 ** 3;

const WARP_FIX =
  "use Cloudflare WARP in WARP mode, not DNS-only (https://one.one.one.one), then re-run stackra doctor";

const sh = (cmd: string, args: string[], cwd?: string): SpawnSyncReturns<string> =>
  spawnSync(cmd, args, { encoding: "utf8", timeout: 30_000, ...(cwd ? { cwd } : {}) });
const has = (cmd: string): boolean => !sh("which", [cmd]).status;

/** Whether nothing listens on `port` on this machine. */
function portFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}

/**
 * The checklist of a workspace.
 *
 * @param root - the workspace root.
 * @param workspace - the workspace as `readDoctorWorkspace` describes it.
 * @param options - `quick` keeps the checks `stackra dev` runs before it starts; `fresh` skips what needs the
 *                  workspace on disk (the install, agents:check).
 * @example
 * const results = await doctorChecks(root, readDoctorWorkspace(root));
 */
export async function doctorChecks(
  root: string,
  workspace: DoctorWorkspace,
  options: { readonly quick?: boolean; readonly fresh?: boolean } = {},
): Promise<DoctorResult[]> {
  const needs = doctorNeeds(workspace);
  const quick = options.quick === true;
  const out: DoctorResult[] = [];
  const add = (result: DoctorResult): void => {
    out.push(result);
  };

  if (!has("mise"))
    add({
      name: "mise installed",
      status: "fail",
      detail: "not on PATH",
      fix: 'install mise (https://mise.jdx.dev), then eval "$(mise activate zsh)"',
    });
  else {
    const r = sh("mise", ["ls", "--current", "--json"], root);
    let missing = ["(mise could not read mise.toml — run `mise trust`)"];
    try {
      missing = missingMiseTools(JSON.parse(r.stdout) as Parameters<typeof missingMiseTools>[0]);
    } catch {
      // unreadable output: keep the `mise trust` hint
    }
    add({
      name: "mise tools",
      status: missing.length ? "fail" : "ok",
      detail: missing.join(", ") || undefined,
      fix: "mise trust && mise install",
      run: ["mise", "install"],
    });
  }

  if (needs.has("services")) {
    const r = sh("docker", ["info", "--format", "json"]);
    const state = dockerState(r.error === undefined ? r.status : null, r.stdout ?? "");
    add({
      name: "Docker engine running",
      status: state === "running" ? "ok" : "fail",
      detail:
        state === "missing"
          ? "no docker CLI; Encore's local infrastructure and Testcontainers need an engine"
          : state === "stopped"
            ? "the docker CLI is installed but no engine answers"
            : undefined,
      fix:
        state === "missing"
          ? "install OrbStack (https://orbstack.dev) or Docker Desktop (https://www.docker.com/products/docker-desktop/)"
          : "start OrbStack or Docker Desktop",
    });
  }

  const ports = [...(needs.has("services") ? ENCORE_PORTS : []), ...workspace.devPorts];
  const busy: number[] = [];
  for (const port of ports) if (!(await portFree(port))) busy.push(port);
  if (ports.length > 0)
    add({
      name: "dev ports free",
      status: busy.length ? "fail" : "ok",
      detail: busy.length ? `in use: ${busy.join(", ")}` : undefined,
      fix: `stop what listens there (lsof -nP -iTCP:${busy[0] ?? ports[0]} -sTCP:LISTEN)`,
    });

  if (quick) return out;

  if (options.fresh !== true)
    add({
      name: "pnpm install done",
      status: existsSync(join(root, "node_modules/.modules.yaml")) ? "ok" : "fail",
      fix: "pnpm install",
      run: ["pnpm", "install"],
    });

  const free = (() => {
    try {
      const stats = statfsSync(root);
      return stats.bavail * stats.bsize;
    } catch {
      return undefined;
    }
  })();
  if (free !== undefined)
    add({
      name: "disk space",
      status: free >= MIN_FREE_BYTES ? "ok" : "warn",
      detail: `${(free / 1024 ** 3).toFixed(1)} GB free`,
      fix: "free at least 5 GB (installs, Docker images and the Encore build cache)",
    });

  const groups: readonly (DoctorNeed | "base")[] = ["base", ...needs];
  const hosts = [...new Set(groups.flatMap((group) => DOCTOR_HOSTS[group] ?? []))];
  const probes = await probeHosts(hosts);
  const dropped = droppedAddresses(probes);
  const down = hosts.filter((host) => !probes.some((probe) => probe.host === host && probe.ok));
  add({
    name: "network",
    status: down.length ? "fail" : dropped.length ? "warn" : "ok",
    detail:
      [
        down.length ? `unreachable: ${down.join(", ")}` : "",
        dropped.length
          ? `dropped while sibling addresses answer: ${dropped.map((probe) => `${probe.host} ${probe.address}`).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("; ") || undefined,
    fix: WARP_FIX,
  });

  // The registry is named explicitly, so the check also works before the app (and its .npmrc) exists.
  const origin = registryOrigin(root, undefined);
  const registry = (name: string) =>
    sh("pnpm", ["view", name, "version", "--json", `--registry=${origin}`], root).status === 0;
  const stackraName = publishedDependency(workspace.manifests, "@stackra");
  if (stackraName !== undefined)
    add({
      name: "@stackra registry readable",
      status: registry(stackraName) ? "ok" : "fail",
      detail: origin,
      fix: "@stackra reads need no token: check the network row above, and that .npmrc maps `@stackra:registry` to the Stackra registry",
    });

  if (!has("gh"))
    add({
      name: "GitHub CLI signed in",
      status: "warn",
      detail: "gh not installed",
      fix: "mise use -g gh, then gh auth login",
    });
  else
    add({
      name: "GitHub CLI signed in",
      status: sh("gh", ["auth", "status"]).status === 0 ? "ok" : "warn",
      fix: "gh auth login",
    });

  if (needs.has("figentra")) {
    const name = publishedDependency(workspace.manifests, "@figentra");
    add({
      name: "@figentra registry readable",
      status: name !== undefined && registry(name) ? "ok" : "fail",
      detail: "the @figentra channel needs the registry read token",
      fix: "infisical login, then load the token the way the repository's README says (the token is never printed)",
    });
  }

  if (needs.has("infisical")) {
    if (!has("infisical"))
      add({
        name: "infisical logged in",
        status: "fail",
        detail: "infisical not installed",
        fix: "mise install",
        run: ["mise", "install"],
      });
    else
      add({
        name: "infisical logged in",
        status: infisicalLoggedIn(sh("infisical", ["profile", "list"]).stdout ?? "")
          ? "ok"
          : "fail",
        fix: "infisical login",
      });
  }

  if (needs.has("services"))
    add({
      name: "encore CLI",
      status: has("encore") ? "ok" : "fail",
      detail: "stackra dev runs the generated Encore app",
      fix: 'pin "aqua:encoredev/encore" in mise.toml, then mise install',
      run: ["mise", "install"],
    });

  if (needs.has("infra"))
    add({
      name: "pulumi CLI",
      status: has("pulumi") ? "ok" : "fail",
      detail: "the root runway deploys infrastructure",
      fix: "pin pulumi in mise.toml, then mise install",
      run: ["mise", "install"],
    });

  if (needs.has("mobile")) {
    add({
      name: "Xcode command-line tools",
      status: sh("xcode-select", ["-p"]).status === 0 ? "ok" : "fail",
      fix: "xcode-select --install",
      run: ["xcode-select", "--install"],
    });
    let simulators: Parameters<typeof simulatorAvailable>[0] = null;
    try {
      simulators = JSON.parse(
        sh("xcrun", ["simctl", "list", "devices", "--json"]).stdout ?? "",
      ) as typeof simulators;
    } catch {
      // no Xcode: no simulator
    }
    add({
      name: "iOS simulator",
      status: simulatorAvailable(simulators) ? "ok" : "fail",
      fix: "open Xcode once and add an iOS simulator runtime (Settings → Components)",
    });
  }

  if (needs.has("agents")) {
    if (!has("aws"))
      add({
        name: "aws bedrock profile",
        status: "fail",
        detail: "aws CLI not installed",
        fix: "mise install",
      });
    else {
      const r = sh("aws", [
        "sts",
        "get-caller-identity",
        "--profile",
        "bedrock",
        "--output",
        "json",
      ]);
      add({
        name: "aws bedrock profile",
        status: awsIdentityOk(r.status, r.stdout ?? "") ? "ok" : "fail",
        fix: "aws sso login --profile bedrock (profile `bedrock` must exist in ~/.aws/config)",
      });
    }
    add({
      name: "claude CLI",
      status: has("claude") ? "ok" : "fail",
      fix: "https://claude.com/claude-code (install the CLI)",
    });
    add({
      name: "opencode CLI",
      status: has("opencode") ? "ok" : "fail",
      fix: "https://opencode.ai/install (v2; not pinned by mise)",
    });
    if (options.fresh !== true)
      add({
        name: "agents:check clean",
        status: sh("pnpm", ["agents:check"], root).status === 0 ? "ok" : "fail",
        fix: "pnpm agents:sync, then commit the projection",
      });
    add({
      name: ".mcp.json present",
      status: existsSync(join(root, ".mcp.json")) ? "ok" : "warn",
      detail: "MCP servers for Claude Code",
      fix: "run pnpm agents:sync (renders it, gitignored, from the committed .mcp.yaml)",
    });
  }
  return out;
}
