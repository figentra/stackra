/**
 * Stackra file contract:
 * Purpose: test fixture: `startCollector()`, a real OpenTelemetry Collector (the pinned contrib image) in
 *          Testcontainers. Its OTLP/HTTP receiver takes logs, traces and metrics only with basic auth (a user and a
 *          password made for the run), and its file exporter writes every export it accepted as one OTLP/JSON line;
 *          `exported()` reads those lines back out of the container.
 * Boundary: test only (integration tier); needs Docker. Nothing leaves the machine: the collector exports to a file
 *           inside its own container. The credentials are random per run and reach the collector as environment
 *           variables, so no password is written in a file or the repository.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 1 and 2: OTLP to a collector); ADR 0182 (integration tier); ADR 0269
 *                     (Testcontainers in tests).
 */
import { randomBytes } from "node:crypto";

import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

/** The collector the drivers are proven against: the contrib distribution, pinned (released 2026-11-07). */
export const COLLECTOR_IMAGE = "otel/opentelemetry-collector-contrib:0.165.0";

/** Where the file exporter writes, one export request per line. */
const OUT = "/otlp/export.jsonl";

/** The OTLP/HTTP receiver and the health check extension. */
const OTLP_PORT = 4318;
const HEALTH_PORT = 13_133;

/** The collector's configuration: basic-auth OTLP/HTTP in, a JSON-lines file out, for all three signals. */
const CONFIG = `
extensions:
  health_check:
    endpoint: 0.0.0.0:${HEALTH_PORT}
  basicauth/server:
    htpasswd:
      inline: |
        \${env:OTLP_USER}:\${env:OTLP_PASSWORD}
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:${OTLP_PORT}
        auth:
          authenticator: basicauth/server
exporters:
  file:
    path: ${OUT}
    flush_interval: 100ms
service:
  extensions: [health_check, basicauth/server]
  pipelines:
    logs: { receivers: [otlp], exporters: [file] }
    traces: { receivers: [otlp], exporters: [file] }
    metrics: { receivers: [otlp], exporters: [file] }
`;

/** A running collector. */
export interface Collector {
  /** The OTLP/HTTP base URL the drivers' `endpoint` names. */
  readonly endpoint: string;
  /** The basic-auth user and password the receiver accepts. */
  readonly user: string;
  readonly password: string;
  /** Every export request the collector accepted and wrote, parsed, oldest first. */
  exported(): Promise<readonly Record<string, unknown>[]>;
  /** Stops and removes the container. */
  stop(): Promise<void>;
}

/** The contents of the first regular file in a tar archive (Docker's archive API answers a ustar stream). */
function firstFile(archive: Buffer): string {
  let at = 0;
  while (at + 512 <= archive.length) {
    const header = archive.subarray(at, at + 512);
    if (header.every((byte) => byte === 0)) break;
    const size = Number.parseInt(header.subarray(124, 136).toString("ascii").trim() || "0", 8);
    const type = String.fromCodePoint(header[156] ?? 0);
    const body = at + 512;
    if (type === "0" || type === "\u0000")
      return archive.subarray(body, body + size).toString("utf8");
    at = body + Math.ceil(size / 512) * 512;
  }
  return "";
}

/** Reads `path` out of `container`. */
async function readFile(container: StartedTestContainer, path: string): Promise<string> {
  const stream = await container.copyArchiveFromContainer(path);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>)
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return firstFile(Buffer.concat(chunks));
}

/**
 * Starts a collector and waits until its health check answers.
 *
 * @example
 * const collector = await startCollector();
 * // ... drivers POST to collector.endpoint ...
 * const lines = await collector.exported();
 * await collector.stop();
 */
export async function startCollector(): Promise<Collector> {
  const user = "stackra";
  const password = randomBytes(18).toString("base64url");
  const container = await new GenericContainer(COLLECTOR_IMAGE)
    .withEnvironment({ OTLP_USER: user, OTLP_PASSWORD: password })
    .withCopyContentToContainer([
      { content: CONFIG, target: "/etc/otelcol-contrib/config.yaml", mode: 0o644 },
      // The image runs as a non-root user: an empty file anyone may write is the export target.
      { content: "", target: OUT, mode: 0o666 },
    ])
    .withExposedPorts(OTLP_PORT, HEALTH_PORT)
    .withWaitStrategy(Wait.forHttp("/", HEALTH_PORT).forStatusCode(200))
    .start();
  return {
    endpoint: `http://${container.getHost()}:${container.getMappedPort(OTLP_PORT)}`,
    user,
    password,
    async exported() {
      return (await readFile(container, OUT))
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => JSON.parse(line) as Record<string, unknown>);
    },
    async stop() {
      await container.stop();
    },
  };
}
