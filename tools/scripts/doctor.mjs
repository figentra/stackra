#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: fresh-machine checklist (`pnpm doctor`) — mise tools, pnpm install, Infisical login, AWS `bedrock`
 *   profile, claude/opencode CLIs, `pnpm agents:check`, .mcp.json. Prints what is missing and how to fix it.
 * Exit: 1 when a required check fails (a `warn` check never fails the run).
 * Secrets: forbidden — only non-secret status commands run (`infisical profile list`, `aws sts get-caller-identity`);
 *   their output is parsed, never printed.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Tools from `mise ls --current --json` that are requested but not installed. */
export function missingMiseTools(json) {
  return Object.entries(json ?? {})
    .filter(([, versions]) => versions.some((v) => !v.installed))
    .map(([name]) => name);
}

/** `infisical profile list` shows one row per login; a usable one has SESSION `active`. */
export const infisicalLoggedIn = (text) => /\bactive\b/.test(text);

/** `aws sts get-caller-identity` succeeded and returned an Account (the value itself is never shown). */
export function awsIdentityOk(status, stdout) {
  if (status !== 0) return false;
  try {
    return Boolean(JSON.parse(stdout).Account);
  } catch {
    return false;
  }
}

/** result: { name, status: "ok" | "fail" | "warn", detail?, fix? } */
export const exitCode = (results) => (results.some((r) => r.status === "fail") ? 1 : 0);

export function render(results) {
  const mark = { ok: "✔", fail: "✖", warn: "!" };
  const lines = results.map((r) => {
    const head = `${mark[r.status]} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`;
    return r.status === "ok" || !r.fix ? head : `${head}\n    fix: ${r.fix}`;
  });
  const bad = results.filter((r) => r.status === "fail").length;
  lines.push(
    "",
    bad
      ? `${bad} check(s) failing — fix the items above, then re-run pnpm doctor.`
      : "All required checks pass.",
  );
  return lines.join("\n");
}

const sh = (cmd, args) => spawnSync(cmd, args, { encoding: "utf8", timeout: 30_000 });
const has = (cmd) => !sh("which", [cmd]).status;

function checks() {
  const out = [];
  const add = (name, status, detail, fix) => out.push({ name, status, detail, fix });

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
      missing = missingMiseTools(JSON.parse(r.stdout));
    } catch {}
    add(
      "mise tools",
      missing.length ? "fail" : "ok",
      missing.join(", ") || undefined,
      "mise trust && mise install",
    );
  }

  add(
    "pnpm install done",
    existsSync("node_modules/.modules.yaml") ? "ok" : "fail",
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
    existsSync(".mcp.json") ? "ok" : "warn",
    "MCP servers for Claude Code",
    "derive it from the committed .mcp.jsonc (instructions in its header)",
  );
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = checks();
  console.log(render(results));
  process.exit(exitCode(results));
}
