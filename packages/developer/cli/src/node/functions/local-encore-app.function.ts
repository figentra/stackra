/**
 * Stackra file contract:
 * Purpose: `withLocalEncoreApp(root, run)`, the outer `encore test` of `stackra test --tier wiring`, run local-only.
 *          Gen writes the root runway's Encore Cloud app id into the member's `encore.app`, and with a non-empty id
 *          `encore test` first fetches the app's secrets from Encore Cloud, which stops any machine that is not logged in
 *          (a CI job, a fresh workstation: "not logged in: run 'encore auth login' first") before a test runs. The
 *          wiring suite needs nothing from Encore Cloud, so the run writes the id `""` into `encore.app` while `run`
 *          runs and puts gen's file back when it settles or this process is stopped. Encore then runs the app under its
 *          local id (`.encore/`, git-ignored), each service on its own test cluster.
 * Boundary: writes only the member's `encore.app`, and puts gen's content back unless something else rewrote the file
 *           meanwhile (a `stackra gen` in another terminal). Never changes the runway or what gen writes, so every
 *           deploy path keeps the real id. A missing `encore.app`, one that is not a JSON object, or one already
 *           local-only is left as it is.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 3: the thin Encore test suite for the wiring); ADR 0091 (amendment of
 *                     2026-11-09, rule 1: gen writes the runway's id); ADR 0525 (dev secret values are local); STA-2838.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** The signals that stop a run; the file is put back before the default action ends this process. */
const STOPS: readonly NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];

/** The text of `encore.app` and its parsed object, or undefined when it is missing or not a JSON object. */
function readApp(file: string): { text: string; app: Record<string, unknown> } | undefined {
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
 * Runs `run` with the Encore app at `root` local-only (`"id": ""` in its `encore.app`), then puts gen's file back.
 *
 * @param root - the service member root, where gen wrote `encore.app`.
 * @param run - the `encore test` to run meanwhile.
 * @returns what `run` resolves with.
 * @example
 * await withLocalEncoreApp("/repo/services/notes", () => runProcess(encoreTest, io)); // encore.app back as gen wrote it
 */
export async function withLocalEncoreApp<T>(root: string, run: () => Promise<T>): Promise<T> {
  const file = join(root, "encore.app");
  const generated = readApp(file);
  const id = generated?.app["id"];
  if (generated === undefined || typeof id !== "string" || id === "") return run();
  const local = `${JSON.stringify({ ...generated.app, id: "" }, null, 2)}\n`;
  writeFileSync(file, local);
  const restore = (): void => {
    for (const signal of STOPS) process.off(signal, onSignal);
    if (existsSync(file) && readFileSync(file, "utf8") === local)
      writeFileSync(file, generated.text);
  };
  function onSignal(signal: NodeJS.Signals): void {
    restore();
    process.kill(process.pid, signal);
  }
  for (const signal of STOPS) process.once(signal, onSignal);
  try {
    return await run();
  } finally {
    restore();
  }
}
