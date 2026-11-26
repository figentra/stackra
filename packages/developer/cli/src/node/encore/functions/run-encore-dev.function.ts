/**
 * Stackra file contract:
 * Purpose: `runEncoreDev(tool, io)`, the `encore run` of a service's `stackra dev`, working whether or not the
 *          workstation is linked to Encore Cloud. Gen writes the root runway's real app id into the member's
 *          `encore.app`, and with a non-empty id `encore run` first fetches the app's secrets from Encore Cloud, which
 *          stops a workstation that is not logged in ("not logged in: run 'encore auth login' first"). So the run
 *          first asks Encore whether it can read that app (`encoreCloudLink`): when it can, Encore runs as it is; when
 *          it cannot, the run says why on one line and runs Encore local-only, with the id `""` in `encore.app`,
 *          then puts gen's file back when Encore exits or this process is stopped. A local run needs nothing from
 *          Encore Cloud: its secret values come from the workspace's dev-secrets file (ADR 0525).
 * Boundary: writes only the member's `encore.app`, and puts gen's content back unless something else rewrote the file
 *           meanwhile (a `stackra gen` in another terminal). Never changes the runway or what gen writes, so every
 *           deploy path keeps the real id; Runway's deploy tree refuses an empty id in case a killed run left one.
 *           A missing `encore.app`, one gen did not write as JSON, or one already local-only starts Encore untouched.
 * Runtime: node
 * Governing contract: ADR 0091 (amendment of 2026-11-09, rule 1: gen writes the runway's id; amendment of 2026-11-10,
 *                     rule 3: `stackra dev` runs `encore run` in the member root); ADR 0525 (amendment of 2026-11-10:
 *                     dev secret values are local); STA-2794.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { encoreCloudLink } from "#node/encore/functions/encore-cloud-link.function";
import { runProcess } from "#node/functions/run-process.function";
import type { CliIo } from "#node/types/cli-io.type";
import type { ToolRun } from "#node/types/tool-run.type";

/** The signals that stop `stackra dev`; the file is put back before the default action ends this process. */
const STOPS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

/** The parsed `encore.app`, or undefined when it is missing or not a JSON object. */
function readApp(
  file: string,
): { readonly text: string; readonly app: Record<string, unknown> } | undefined {
  if (!existsSync(file)) return undefined;
  const text = readFileSync(file, "utf8");
  try {
    const app: unknown = JSON.parse(text);
    return typeof app === "object" && app !== null && !Array.isArray(app)
      ? { text, app: app as Record<string, unknown> }
      : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Starts `encore run` for a service and resolves with its exit code.
 *
 * @param tool - the `encore run` process `resolveTool` chose, in the member root.
 * @param io - where the link line goes, and the run's output when it does not inherit the terminal.
 * @example
 * await runEncoreDev({ command: "encore", args: ["run"], cwd: "/repo/services/notes" }, PROCESS_IO);
 * // encore: Encore Cloud app acme-platform is out of reach (not logged in …); running local-only
 */
export async function runEncoreDev(tool: ToolRun, io: CliIo): Promise<number> {
  const file = join(tool.cwd, "encore.app");
  const generated = readApp(file);
  const id = generated?.app["id"];
  if (generated === undefined || typeof id !== "string" || id === "") return runProcess(tool, io);

  const link = await encoreCloudLink(tool.cwd);
  if (link.linked) {
    io.out(`encore: linked to Encore Cloud app ${id}\n`);
    return runProcess(tool, io);
  }
  io.out(
    `encore: Encore Cloud app ${id} is out of reach (${link.reason}); running local-only. ` +
      "Run `encore auth login` to use the cloud app; deploys always use it.\n",
  );
  const local = `${JSON.stringify({ ...generated.app, id: "" }, null, 2)}\n`;
  writeFileSync(file, local);

  const restore = (): void => {
    for (const signal of STOPS) process.off(signal, onSignal);
    if (existsSync(file) && readFileSync(file, "utf8") === local)
      writeFileSync(file, generated.text);
  };
  // Put the file back, then let the signal do what it would have done (end this process); Encore gets it from the
  // terminal's process group as before.
  function onSignal(signal: NodeJS.Signals): void {
    restore();
    process.kill(process.pid, signal);
  }
  for (const signal of STOPS) process.once(signal, onSignal);
  try {
    return await runProcess(tool, io);
  } finally {
    restore();
  }
}
