/**
 * Stackra file contract:
 * Purpose: test fixture: `startCollector()`, a real OpenTelemetry Collector (contrib 0.165.0): the pinned image in
 *          Testcontainers, or the same release's binary when `STACKRA_OTELCOL_BIN` names one (a host without Docker
 *          disk, such as a build box). Its OTLP/HTTP receiver takes logs, traces and metrics only with basic auth (a user
 *          and a password made for the run), and its file exporter writes every export it accepted as one OTLP/JSON
 *          line; `exported()` reads those lines back.
 * Boundary: test only (integration tier); needs Docker or the binary. Nothing leaves the machine: the collector exports
 *           to a file of its own. The credentials are random per run and reach the collector as environment
 *           variables, so no password is written in a file or the repository. The binary must report the pinned
 *           version, so both modes prove the same collector.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 1 and 2: OTLP to a collector); ADR 0182 (integration tier); ADR 0269
 *                     (Testcontainers in tests).
 */
import { execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, readFile as readText, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";

import { GenericContainer, Wait } from "testcontainers";
import type { StartedTestContainer } from "testcontainers";

/** The collector release the drivers are proven against (released 2026-11-07). */
export const COLLECTOR_VERSION = "0.165.0";

/** The same release as an image: the contrib distribution, pinned. */
export const COLLECTOR_IMAGE = `otel/opentelemetry-collector-contrib:${COLLECTOR_VERSION}`;

/** Where the file exporter writes inside the container, one export request per line. */
const OUT = "/otlp/export.jsonl";

/** The OTLP/HTTP receiver and the health check extension, inside the container. */
const OTLP_PORT = 4318;
const HEALTH_PORT = 13_133;

/** The collector's configuration: basic-auth OTLP/HTTP in, a JSON-lines file out, for all three signals. */
function collectorConfig(host: string, otlpPort: number, healthPort: number, out: string): string {
  return `
extensions:
  health_check:
    endpoint: ${host}:${healthPort}
  basicauth/server:
    htpasswd:
      inline: |
        \${env:OTLP_USER}:\${env:OTLP_PASSWORD}
receivers:
  otlp:
    protocols:
      http:
        endpoint: ${host}:${otlpPort}
        auth:
          authenticator: basicauth/server
exporters:
  file:
    path: ${out}
    flush_interval: 100ms
service:
  extensions: [health_check, basicauth/server]
  pipelines:
    logs: { receivers: [otlp], exporters: [file] }
    traces: { receivers: [otlp], exporters: [file] }
    metrics: { receivers: [otlp], exporters: [file] }
`;
}

/** A running collector. */
export interface Collector {
  /** The OTLP/HTTP base URL the drivers' `endpoint` names. */
  readonly endpoint: string;
  /** The basic-auth user and password the receiver accepts. */
  readonly user: string;
  readonly password: string;
  /** Every export request the collector accepted and wrote, parsed, oldest first. */
  exported(): Promise<readonly Record<string, unknown>[]>;
  /** Stops the collector and removes what it wrote. */
  stop(): Promise<void>;
}

/** The parsed lines of a JSON-lines export. */
function lines(text: string): readonly Record<string, unknown>[] {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as Record<string, unknown>);
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
async function readFromContainer(container: StartedTestContainer, path: string): Promise<string> {
  const stream = await container.copyArchiveFromContainer(path);
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer | string>)
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  return firstFile(Buffer.concat(chunks));
}

/** A free TCP port on the loopback interface. */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() =>
        typeof address === "object" && address !== null
          ? resolve(address.port)
          : reject(new Error("no port")),
      );
    });
  });
}

/** Resolves once `url` answers 200, or rejects with `log()` after `timeoutMs`. */
async function healthy(url: string, log: () => string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).status === 200) return;
    } catch {
      // not listening yet
    }
    await sleep(200);
  }
  throw new Error(`${url} never answered 200:\n${log()}`);
}

/** The collector as the pinned image in Testcontainers. */
async function inContainer(user: string, password: string): Promise<Collector> {
  const container = await new GenericContainer(COLLECTOR_IMAGE)
    .withEnvironment({ OTLP_USER: user, OTLP_PASSWORD: password })
    .withCopyContentToContainer([
      {
        content: collectorConfig("0.0.0.0", OTLP_PORT, HEALTH_PORT, OUT),
        target: "/etc/otelcol-contrib/config.yaml",
        mode: 0o644,
      },
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
      return lines(await readFromContainer(container, OUT));
    },
    async stop() {
      await container.stop();
    },
  };
}

/** The collector as the release binary at `bin`, listening on loopback ports of its own. */
async function asProcess(bin: string, user: string, password: string): Promise<Collector> {
  const { stdout } = await promisify(execFile)(bin, ["--version"]);
  if (!stdout.includes(COLLECTOR_VERSION))
    throw new Error(`${bin} is not otelcol-contrib ${COLLECTOR_VERSION}: ${stdout.trim()}`);
  const dir = await mkdtemp(join(tmpdir(), "stackra-otelcol-"));
  const out = join(dir, "export.jsonl");
  const config = join(dir, "config.yaml");
  const [otlpPort, healthPort] = [await freePort(), await freePort()];
  await writeFile(out, "");
  await writeFile(config, collectorConfig("127.0.0.1", otlpPort, healthPort, out));
  const child = spawn(bin, ["--config", config], {
    env: { ...process.env, OTLP_USER: user, OTLP_PASSWORD: password },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let log = "";
  child.stdout.on("data", (chunk: Buffer) => (log += chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => (log += chunk.toString()));
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  try {
    await healthy(`http://127.0.0.1:${healthPort}/`, () => log);
  } catch (error) {
    child.kill("SIGKILL");
    await rm(dir, { recursive: true, force: true });
    throw error;
  }
  return {
    endpoint: `http://127.0.0.1:${otlpPort}`,
    user,
    password,
    async exported() {
      return lines(await readText(out, "utf8"));
    },
    async stop() {
      child.kill("SIGTERM");
      await exited;
      await rm(dir, { recursive: true, force: true });
    },
  };
}

/**
 * Starts a collector and waits until its health check answers: the binary `STACKRA_OTELCOL_BIN` names, else the image.
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
  const bin = process.env["STACKRA_OTELCOL_BIN"];
  return bin === undefined || bin === ""
    ? inContainer(user, password)
    : asProcess(bin, user, password);
}
