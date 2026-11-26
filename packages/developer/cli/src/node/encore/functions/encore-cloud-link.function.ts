/**
 * Stackra file contract:
 * Purpose: `encoreCloudLink(root)`, whether the Encore CLI on this workstation can reach the Encore Cloud app named in
 *          the service's generated `encore.app`. It runs `encore secret list` in the member root: the same Encore Cloud
 *          read of the app's secrets that `encore run` makes before it starts, so a yes here means `encore run` gets
 *          past "Fetching application secrets", and a no carries the error Encore would have stopped on.
 * Boundary: starts one `encore` process, with its output captured and dropped (it names secrets, never a value), and
 *           stopped after `PROBE_TIMEOUT_MS`; writes nothing.
 * Runtime: node
 * Governing contract: ADR 0091 (amendment of 2026-11-09, rule 1); ADR 0525 (amendment of 2026-11-10); STA-2794.
 */
import type { EncoreCloudLink } from "#node/encore/types/encore-cloud-link.type";
import { captureIo } from "#node/functions/capture-io.function";
import { runProcess } from "#node/functions/run-process.function";

/** How long the probe may take: a logged-in CLI answers in about a second; a dead network must not stall `stackra dev`. */
const PROBE_TIMEOUT_MS = 20_000;

/**
 * The Encore Cloud link of the service at `root`.
 *
 * @param root - the service member root, where gen wrote `encore.app`.
 * @example
 * await encoreCloudLink("/repo/services/notes");
 * // { linked: false, reason: "… not logged in: run 'encore auth login' first" }
 */
export async function encoreCloudLink(root: string): Promise<EncoreCloudLink> {
  const { io, output } = captureIo();
  const code = await runProcess(
    { command: "encore", args: ["secret", "list"], cwd: root, timeoutMs: PROBE_TIMEOUT_MS },
    io,
  );
  if (code === 0) return { linked: true };
  const lines = output()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return {
    linked: false,
    reason: (lines.at(-1) ?? `encore secret list exited ${code}`).replace(/^error:\s*/, ""),
  };
}
