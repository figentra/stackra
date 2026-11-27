/**
 * Stackra file contract:
 * Purpose: `browserLogsPlugin()`, the dev server's browser log: it adds `browserLogClient` to Vite's own client module
 *          (which every page the dev server serves loads, single-page or server-rendered), and answers
 *          `BROWSER_LOG_ROUTE` by checking the request (`browserLogRefusal`), reading at most
 *          `BROWSER_LOG_LIMITS.bodyBytes`, and appending the entries (`browserLogEntries`) to the repository's dev
 *          log (`appendDevLog`, which redacts with the logger's rules), where the local MCP's `browser_logs`,
 *          `logs` and `last_error` tools read them.
 * Boundary: `apply: "serve"`: never part of a build, so a built app carries no client and no route. A report that
 *           cannot be read or written answers an error status and never stops the dev server.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5: the local MCP reads the app); ADR 0261 (decision 4: the preset's own
 *                     plugins); ADR 0147 (decision 1); STA-2889.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, relative } from "node:path";

import { appendDevLog, devLogFile } from "@stackra/runway/node";
import type { Plugin } from "vite";

import { BROWSER_LOG_LIMITS } from "#core/constants/browser-log-limits.constant";
import { BROWSER_LOG_ROUTE } from "#core/constants/browser-log-route.constant";
import { browserLogClient } from "#core/functions/browser-log-client.function";
import { browserLogEntries } from "#core/functions/browser-log-entries.function";
import { browserLogRefusal } from "#core/functions/browser-log-refusal.function";

/** Vite's own client modules: the unbundled client and the bundled-dev one. */
const VITE_CLIENT = /\/vite\/dist\/client\/(?:client|bundledDevClient)\.mjs$/;

/** Ends `res` with `status` and `text`. */
function answer(res: ServerResponse, status: number, text = ""): void {
  res.statusCode = status;
  if (text !== "") res.setHeader("content-type", "text/plain; charset=utf-8");
  res.end(text);
}

/** Reads the body of `req`, or undefined when it passes `limit` bytes (the request is answered 413). */
function readBody(
  req: IncomingMessage,
  res: ServerResponse,
  limit: number,
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let over = false;
    req.on("data", (chunk: Buffer) => {
      if (over) return;
      size += chunk.length;
      if (size > limit) {
        over = true;
        answer(res, 413, `a browser report is at most ${limit} bytes`);
        resolve(undefined);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!over) resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", () => {
      if (!over) resolve(undefined);
    });
  });
}

/**
 * The dev server's browser log.
 *
 * @example
 * corePlugins(); // [..., stackra:browser-logs]
 */
export function browserLogsPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: "stackra:browser-logs",
    apply: "serve",
    configResolved(config) {
      root = config.root;
    },
    transform(code, id) {
      if (this.environment?.config.consumer === "server") return undefined;
      if (!VITE_CLIENT.test(id.split("?")[0]?.replaceAll("\\", "/") ?? "")) return undefined;
      return {
        code: `${code}\n${browserLogClient(BROWSER_LOG_ROUTE, BROWSER_LOG_LIMITS.perPage)}`,
        map: null,
      };
    },
    configureServer(server) {
      server.middlewares.use(BROWSER_LOG_ROUTE, (req, res) => {
        const refusal = browserLogRefusal(req.method, req.headers);
        if (refusal !== undefined) {
          answer(res, refusal.status, refusal.reason);
          return;
        }
        void readBody(req, res, BROWSER_LOG_LIMITS.bodyBytes).then((body) => {
          if (body === undefined) return;
          let parsed: unknown;
          try {
            parsed = JSON.parse(body);
          } catch {
            answer(res, 400, "not JSON");
            return;
          }
          const file = devLogFile(root);
          // The repository root is the folder that holds `.stackra/logs/`.
          const member = relative(dirname(dirname(dirname(file))), root) || ".";
          try {
            appendDevLog(file, browserLogEntries(parsed, member, new Date()));
            answer(res, 204);
          } catch (error) {
            answer(res, 500, `the dev log is not written: ${(error as Error).message}`);
          }
        });
      });
    },
  };
}
