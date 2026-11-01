/**
 * Stackra file contract:
 * Purpose: `runPreviewServe(context)`, the run of `stackra preview serve --surface <key> [--port <n>] [--api <url>]
 *          [--api-prefix <path,…>] [--region <r>]` at a product root: starts Runway's local edge for one built web
 *          surface (`previewServe`), prints its URL, and stops on SIGINT or SIGTERM.
 * Boundary: parses, starts and prints; the serving is Runway's. Listens on loopback only.
 * Runtime: node
 * Governing contract: ADR 0437 (decisions 2 and 3); STA-1676.
 */
import { previewServe } from "@stackra/runway/node";

import { CliUsageError } from "#node/errors/cli-usage.error";
import type { CliContext } from "#node/types/cli-context.type";

/**
 * Serves the surface until the process is told to stop, and resolves with the exit code.
 *
 * @throws CliUsageError when no surface is named or the port is not a port.
 * @example
 * await runPreviewServe({ ...context, values: { surface: "console", api: "http://127.0.0.1:4000" } });
 */
export async function runPreviewServe(context: CliContext): Promise<number> {
  const { cwd, io, values } = context;
  const surface = values["surface"];
  if (typeof surface !== "string" || surface === "")
    throw new CliUsageError("name the surface: --surface <key>, such as console");
  const port = values["port"] === undefined ? undefined : Number(values["port"]);
  if (port !== undefined && !(Number.isInteger(port) && port >= 0 && port <= 65_535))
    throw new CliUsageError("--port takes a port number");
  const api = typeof values["api"] === "string" ? values["api"] : undefined;
  const prefixes =
    typeof values["api-prefix"] === "string"
      ? values["api-prefix"]
          .split(",")
          .map((prefix) => prefix.trim())
          .filter((prefix) => prefix !== "")
      : undefined;
  const region = typeof values["region"] === "string" ? values["region"] : undefined;

  const server = await previewServe({
    repository: cwd,
    surface,
    ...(port === undefined ? {} : { port }),
    ...(api === undefined ? {} : { api }),
    ...(prefixes === undefined ? {} : { apiPrefixes: prefixes }),
    ...(region === undefined ? {} : { region }),
  });
  io.out(
    `serving ${surface} at ${server.url}${api === undefined ? " (no API upstream: /api answers 503)" : ` (API ${api})`}\n`,
  );
  await new Promise<void>((settle) => {
    process.once("SIGINT", () => settle());
    process.once("SIGTERM", () => settle());
  });
  await server.close();
  return 0;
}
