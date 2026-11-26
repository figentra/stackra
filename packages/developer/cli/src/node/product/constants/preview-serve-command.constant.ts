/**
 * Stackra file contract:
 * Purpose: `PREVIEW_SERVE_COMMAND`, `stackra preview serve --surface <key> [--port <n>] [--api <url>]
 *          [--api-prefix <path,…>] [--region <r>]`: serves a built web surface locally as the edge would
 *          (`runPreviewServe`).
 * Boundary: data plus dispatch.
 * Runtime: node
 * Governing contract: ADR 0437; STA-1676.
 */
import { runPreviewServe } from "#node/product/functions/run-preview-serve.function";
import type { CliCommand } from "#node/types/cli-command.type";

/** The `stackra preview serve` command definition. */
export const PREVIEW_SERVE_COMMAND: CliCommand = {
  name: "preview serve",
  summary:
    "Serve a built web surface on 127.0.0.1 as the edge would: the shell, the bundle and an API proxy",
  usage:
    "stackra preview serve --surface <key> [--port <n>] [--api <url>] [--api-prefix <path,…>] [--region <r>]",
  options: {
    surface: { type: "string" },
    port: { type: "string" },
    api: { type: "string" },
    "api-prefix": { type: "string" },
    region: { type: "string" },
  },
  run: runPreviewServe,
};
