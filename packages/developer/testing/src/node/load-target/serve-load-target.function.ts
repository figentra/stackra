/**
 * Stackra file contract:
 * Purpose: `serveLoadTarget(scenarios)`, a small HTTP server in the test's own process that k6 drives: `POST
 *          /scenarios/<name>` runs one unit of scenario `<name>` and answers 204 when it resolves, or 500 with the
 *          error's message when it throws; `GET /health` answers 204; anything else 404. It times each run on the server
 *          side, so a load test reports the subject's own latency next to k6's, which includes the loopback hop.
 * Boundary: listens on 127.0.0.1 only, on a free port; reads no request body; keeps every run time in memory until
 *           `close`. A scenario's work runs in the test's process with whatever the test wired (a real database, a
 *           relay looping beside it), so the numbers are that process's.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: weekly k6 load tests); STA-317.
 */
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { performance } from "node:perf_hooks";

import { summariseLatencies } from "#node/latency/summarise-latencies.function";
import type { LoadScenarios } from "#node/load-target/load-scenarios.type";
import type { LoadTarget } from "#node/load-target/load-target.type";

/** A scenario route: `/scenarios/<name>`. */
const ROUTE = /^\/scenarios\/([\w.-]+)$/;

/** What a target records of one scenario. */
interface Record {
  readonly durations: number[];
  failures: number;
  first?: string;
}

/**
 * Starts a load target for `scenarios`.
 *
 * @throws Error when the server cannot listen.
 * @example
 * const target = await serveLoadTarget({ push: () => queue.push(SendJob, {}) });
 * await runK6({ target: target.url, scenario: "push", load });
 * target.latency("push").p95;
 * await target.close();
 */
export async function serveLoadTarget(scenarios: LoadScenarios): Promise<LoadTarget> {
  const records = new Map<string, Record>(
    Object.keys(scenarios).map((name) => [name, { durations: [], failures: 0 }]),
  );
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://target").pathname;
    if (request.method === "GET" && path === "/health") {
      response.writeHead(204).end();
      return;
    }
    const name = ROUTE.exec(path)?.[1];
    const work = name === undefined ? undefined : scenarios[name];
    const record = name === undefined ? undefined : records.get(name);
    if (request.method !== "POST" || work === undefined || record === undefined) {
      response.writeHead(404).end();
      return;
    }
    // The body is never read: drain it so the connection stays reusable.
    request.resume();
    const started = performance.now();
    work().then(
      () => {
        record.durations.push(performance.now() - started);
        response.writeHead(204).end();
      },
      (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        record.failures += 1;
        record.first ??= message;
        response.writeHead(500, { "content-type": "text/plain; charset=utf-8" }).end(message);
      },
    );
  });
  // k6 keeps its connections open between iterations; a short idle timeout would make it reconnect mid-soak.
  server.keepAliveTimeout = 60_000;
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    latency(name) {
      const record = records.get(name);
      if (record === undefined) throw new Error(`the load target serves no scenario "${name}"`);
      return summariseLatencies(record.durations, { count: record.failures, first: record.first });
    },
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error === undefined ? resolve() : reject(error)));
        server.closeAllConnections();
      }),
  };
}
