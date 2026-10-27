#!/usr/bin/env node
/**
 * Stackra file contract:
 * Purpose: `pnpm speckit:sync` — install the Stackra spec-kit preset from its only source, `.agents/speckit/presets/`,
 *   into `.specify/presets/`, keep the bundled `speckit` workflow disabled, and re-render both integrations
 *   (spec-kit registers preset commands for the active integration only, so OpenCode first, then Claude).
 *   The installed copies are generated and committed; `spec-gate ci` (tripwire) fails when they drift from the source.
 * Boundary: writes only `.specify/`, through the pinned `specify`.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC specs); ADR 0027 (CLI tools pinned in mise).
 * Needs: the pinned `specify` on PATH (mise.toml). Local only; CI never runs it.
 * Secrets: none.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const PRESETS = ".agents/speckit/presets";

/** The `specify` calls, in order, that bring `.specify/` in line with the sources. */
export function steps(presets, installed) {
  return [
    ...presets.map((id) => [
      "preset",
      installed.includes(id) ? "update" : "add",
      ...(installed.includes(id) ? [id] : []),
      "--dev",
      `${PRESETS}/${id}`,
    ]),
    ["workflow", "disable", "speckit"],
    ["integration", "use", "opencode"],
    ["integration", "use", "claude"],
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const list = (p) => (existsSync(join(ROOT, p)) ? readdirSync(join(ROOT, p)) : []);
  const presets = list(PRESETS);
  const installed = list(".specify/presets").filter((n) => !n.startsWith("."));
  for (const args of steps(presets, installed)) {
    console.log(`$ specify ${args.join(" ")}`);
    const r = spawnSync("specify", args, { cwd: ROOT, stdio: "inherit" });
    // `workflow disable` fails when it is already disabled; nothing else may.
    if (r.status !== 0 && args[0] !== "workflow") process.exit(r.status ?? 1);
  }
  rmSync(join(ROOT, ".specify/.workflow-install.lock"), { force: true });
  const bash = join(ROOT, ".specify/scripts/bash");
  for (const f of list(".specify/scripts/bash"))
    if (f.endsWith(".sh")) chmodSync(join(bash, f), 0o755);
}
