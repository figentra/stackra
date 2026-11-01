/**
 * Stackra file contract:
 * Purpose: `DOCTOR_COMMAND`, `stackra doctor` (`pnpm doctor`): the fresh-machine checklist: mise tools, pnpm install,
 *          Infisical login, the AWS `bedrock` profile, the claude and opencode CLIs, the pinned spec-kit `specify`,
 *          `pnpm agents:check` and .mcp.json. Prints what is missing and how to fix it; exits 1 when a required check
 *          fails (a `warn` check never fails the run) (was `tools/scripts/doctor.mjs`).
 * Boundary: runs read-only status commands and prints what is missing; installs and changes nothing. Secrets:
 *           forbidden: only non-secret status commands run (`infisical profile list`, `aws sts get-caller-identity`);
 *           their output is parsed, never printed.
 * Runtime: node
 * Governing contract: ADR 0027 (CLI tools pinned in mise); ADR 0121 (SDLC tooling roles); ADR 0282 (decision 3).
 */
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { awsIdentityOk } from "#node/doctor/functions/aws-identity-ok.function";
import { doctorExitCode } from "#node/doctor/functions/doctor-exit-code.function";
import { infisicalLoggedIn } from "#node/doctor/functions/infisical-logged-in.function";
import { missingMiseTools } from "#node/doctor/functions/missing-mise-tools.function";
import { renderDoctor } from "#node/doctor/functions/render-doctor.function";
import { speckitMatches } from "#node/doctor/functions/speckit-matches.function";
import { speckitPin } from "#node/doctor/functions/speckit-pin.function";
import type { DoctorResult } from "#node/doctor/types/doctor-result.type";
import { workspaceRoot } from "#node/functions/workspace-root.function";
import type { CliCommand } from "#node/types/cli-command.type";

const sh = (cmd: string, args: string[]): SpawnSyncReturns<string> =>
  spawnSync(cmd, args, { encoding: "utf8", timeout: 30_000 });
const has = (cmd: string): boolean => !sh("which", [cmd]).status;

/** Every check of the workspace at `root`, in checklist order. */
function checks(root: string): DoctorResult[] {
  const out: DoctorResult[] = [];
  const add = (
    name: string,
    status: DoctorResult["status"],
    detail?: string,
    fix?: string,
  ): void => {
    out.push({ name, status, detail, fix });
  };

  if (!has("mise"))
    add(
      "mise installed",
      "fail",
      "not on PATH",
      'brew install mise && eval "$(mise activate zsh)"',
    );
  else {
    const r = sh("mise", ["ls", "--current", "--json"]);
    let missing = ["(mise could not read mise.toml — run `mise trust`)"];
    try {
      missing = missingMiseTools(JSON.parse(r.stdout) as Parameters<typeof missingMiseTools>[0]);
    } catch {
      // unreadable output: keep the `mise trust` hint
    }
    add(
      "mise tools",
      missing.length ? "fail" : "ok",
      missing.join(", ") || undefined,
      "mise trust && mise install",
    );
  }

  add(
    "pnpm install done",
    existsSync(join(root, "node_modules/.modules.yaml")) ? "ok" : "fail",
    undefined,
    "pnpm install",
  );

  if (!has("infisical"))
    add("infisical logged in", "fail", "infisical not installed", "mise install");
  else {
    const r = sh("infisical", ["profile", "list"]);
    add(
      "infisical logged in",
      infisicalLoggedIn(r.stdout ?? "") ? "ok" : "fail",
      undefined,
      "infisical login",
    );
  }

  if (!has("aws"))
    add("aws bedrock profile", "fail", "aws CLI not installed", "brew install awscli");
  else {
    const r = sh("aws", ["sts", "get-caller-identity", "--profile", "bedrock", "--output", "json"]);
    add(
      "aws bedrock profile",
      awsIdentityOk(r.status, r.stdout ?? "") ? "ok" : "fail",
      undefined,
      "aws sso login --profile bedrock (profile `bedrock` must exist in ~/.aws/config)",
    );
  }

  add(
    "claude CLI",
    has("claude") ? "ok" : "fail",
    undefined,
    "https://claude.com/claude-code (install the CLI)",
  );
  add(
    "opencode CLI",
    has("opencode") ? "ok" : "fail",
    undefined,
    "https://opencode.ai/install (v2; not pinned by mise)",
  );
  const miseToml = join(root, "mise.toml");
  const pin = speckitPin(existsSync(miseToml) ? readFileSync(miseToml, "utf8") : "");
  const specify = has("specify") ? (sh("specify", ["--version"]).stdout ?? "") : "";
  add(
    `spec-kit ${pin ?? "(unpinned)"}`,
    speckitMatches(specify, pin) ? "ok" : "fail",
    specify ? specify.trim() : "specify not on PATH",
    "mise install (pinned as pipx:specify-cli in mise.toml)",
  );
  add(
    "encore CLI",
    has("encore") ? "ok" : "warn",
    "only needed once a service adopts Encore",
    "brew install encoredev/tap/encore",
  );

  const sync = sh("pnpm", ["agents:check"]);
  add(
    "agents:check clean",
    sync.status === 0 ? "ok" : "fail",
    undefined,
    "pnpm agents:sync, then commit the projection",
  );

  add(
    ".mcp.json present",
    existsSync(join(root, ".mcp.json")) ? "ok" : "warn",
    "MCP servers for Claude Code",
    "run pnpm agents:sync (renders it, gitignored, from the committed .mcp.yaml)",
  );
  return out;
}

/** The `stackra doctor` command. */
export const DOCTOR_COMMAND: CliCommand = {
  name: "doctor",
  summary: "Check a fresh machine: toolchain, install, Infisical login, CLIs, agent sync",
  usage: "stackra doctor",
  async run({ cwd, io }) {
    const results = checks(workspaceRoot(cwd));
    io.out(`${renderDoctor(results)}\n`);
    return doctorExitCode(results);
  },
};
