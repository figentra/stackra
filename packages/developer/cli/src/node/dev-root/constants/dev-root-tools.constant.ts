/**
 * Stackra file contract:
 * Purpose: `DEV_ROOT_TOOLS`, the real side effects of root `stackra dev`: tool processes (`runProcess`), captured
 *          output (`runProgram`), the gateway wait (`waitForHttp`) and port forwards (`startPortForward`).
 * Boundary: frozen data; tests pass their own `DevRootTools`.
 * Runtime: node
 * Governing contract: STA-2840.
 */
import { runProgram } from "@stackra/runway/node";

import { startPortForward } from "#node/dev-root/functions/start-port-forward.function";
import { waitForHttp } from "#node/dev-root/functions/wait-for-http.function";
import type { DevRootTools } from "#node/dev-root/types/dev-root-tools.type";
import { runProcess } from "#node/functions/run-process.function";

/** The tools a real root dev run uses. */
export const DEV_ROOT_TOOLS: DevRootTools = Object.freeze({
  run: runProcess,
  capture: (command: string, args: readonly string[], options: { readonly cwd: string }) =>
    runProgram(command, args, options),
  waitFor: (url: string, timeoutMs: number, signal?: AbortSignal) =>
    waitForHttp(url, timeoutMs, signal === undefined ? {} : { signal }),
  forward: (port: number, target: number) => startPortForward(port, target),
});
