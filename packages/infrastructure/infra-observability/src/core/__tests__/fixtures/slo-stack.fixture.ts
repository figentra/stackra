/**
 * Stackra file contract:
 * Purpose: test fixture: `startSloStack(rules)`, the metrics path of the on-premises LGTM stack, real end to end: an
 *          OpenTelemetry Collector (contrib 0.165.0) whose OTLP/HTTP receiver forwards metrics through its `otlphttp`
 *          exporter to Prometheus 3.15.1's own OTLP receiver, and that Prometheus evaluating `rules` (a rule file)
 *          every second. `query(expr)` asks Prometheus's HTTP API. Both run as the pinned images on one Testcontainers
 *          network, or as the same releases' binaries when `STACKRA_OTELCOL_BIN` and `STACKRA_PROMETHEUS_DIR` name
 *          them (a host without Docker disk, such as a build box).
 * Boundary: test only (integration tier); needs Docker or both binaries. Nothing leaves the machine: Prometheus scrapes
 *           nothing and stores in a folder of the run, removed on `stop()`. The binaries must report the pinned
 *           versions, so both modes prove the same stack.
 * Runtime: node (vitest)
 * Governing contract: ADR 0184 (decisions 1 to 3: OTLP to a collector, the LGTM stack, the objectives); ADR 0182
 *                     (integration tier); ADR 0269 (Testcontainers in tests).
 */
import { execFile, spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";

import { GenericContainer, Network, Wait } from "testcontainers";

import { PROMETHEUS_IMAGE, releasePromtool } from "#core/__tests__/fixtures/promtool.fixture";

/** The collector release, as a binary version and an image. */
const COLLECTOR_VERSION = "0.165.0";
const COLLECTOR_IMAGE = `otel/opentelemetry-collector-contrib:${COLLECTOR_VERSION}`;

/** The ports inside the containers. */
const OTLP_PORT = 4318;
const HEALTH_PORT = 13_133;
const PROMETHEUS_PORT = 9090;

/** One series of an instant query. */
export interface Sample {
  readonly metric: Readonly<Record<string, string>>;
  readonly value: number;
}

/** A running stack. */
export interface SloStack {
  /** The collector's OTLP/HTTP base URL, which a metrics driver's `endpoint` names. */
  readonly otlpEndpoint: string;
  /** The series `expr` returns now. */
  query(expr: string): Promise<readonly Sample[]>;
  /** Stops both and removes what they wrote. */
  stop(): Promise<void>;
}

/** The collector's configuration: OTLP/HTTP in, Prometheus's OTLP receiver out. */
function collectorConfig(host: string, otlpPort: number, healthPort: number, prometheus: string) {
  return `
extensions:
  health_check:
    endpoint: ${host}:${healthPort}
receivers:
  otlp:
    protocols:
      http:
        endpoint: ${host}:${otlpPort}
exporters:
  otlphttp/prometheus:
    metrics_endpoint: ${prometheus}/api/v1/otlp/v1/metrics
    tls:
      insecure: true
service:
  extensions: [health_check]
  pipelines:
    metrics: { receivers: [otlp], exporters: [otlphttp/prometheus] }
`;
}

/** Prometheus's configuration: the rule file, evaluated every second; nothing scraped. */
function prometheusConfig(rules: string): string {
  return `
global:
  evaluation_interval: 1s
rule_files:
  - ${rules}
`;
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
async function healthy(url: string, log: () => string, timeoutMs = 60_000): Promise<void> {
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

/** The instant query `expr` against the Prometheus at `base`. */
async function instant(base: string, expr: string): Promise<readonly Sample[]> {
  const response = await fetch(`${base}/api/v1/query?query=${encodeURIComponent(expr)}`);
  const body = (await response.json()) as {
    status: string;
    error?: string;
    data?: { result: readonly { metric: Record<string, string>; value: [number, string] }[] };
  };
  if (body.status !== "success") throw new Error(`${expr}: ${body.error ?? response.status}`);
  return (body.data?.result ?? []).map((row) => ({
    metric: row.metric,
    value: Number(row.value[1]),
  }));
}

/** Starts `bin` with `args`, keeping its output for a failure message. */
function started(bin: string, args: readonly string[]): { child: ChildProcess; log: () => string } {
  const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout?.on("data", (chunk: Buffer) => (log += chunk.toString()));
  child.stderr?.on("data", (chunk: Buffer) => (log += chunk.toString()));
  return { child, log: () => log.slice(-4000) };
}

/** Stops `child` and waits for it to exit. */
async function stopped(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  child.kill("SIGTERM");
  await exited;
}

/** The stack as the release binaries, on loopback ports of their own. */
async function asProcesses(collectorBin: string, prometheusDir: string, rules: string) {
  const { stdout } = await promisify(execFile)(collectorBin, ["--version"]);
  if (!stdout.includes(COLLECTOR_VERSION))
    throw new Error(
      `${collectorBin} is not otelcol-contrib ${COLLECTOR_VERSION}: ${stdout.trim()}`,
    );
  await releasePromtool(prometheusDir);
  const dir = await mkdtemp(join(tmpdir(), "stackra-slo-stack-"));
  const [promPort, otlpPort, healthPort] = [await freePort(), await freePort(), await freePort()];
  const prometheusBase = `http://127.0.0.1:${promPort}`;
  await writeFile(join(dir, "slo-rules.yml"), rules);
  await writeFile(join(dir, "prometheus.yml"), prometheusConfig(join(dir, "slo-rules.yml")));
  await writeFile(
    join(dir, "otelcol.yaml"),
    collectorConfig("127.0.0.1", otlpPort, healthPort, prometheusBase),
  );
  const prometheus = started(join(prometheusDir, "prometheus"), [
    `--config.file=${join(dir, "prometheus.yml")}`,
    `--storage.tsdb.path=${join(dir, "data")}`,
    `--web.listen-address=127.0.0.1:${promPort}`,
    "--web.enable-otlp-receiver",
  ]);
  const collector = started(collectorBin, ["--config", join(dir, "otelcol.yaml")]);
  const stop = async () => {
    await stopped(collector.child);
    await stopped(prometheus.child);
    await rm(dir, { recursive: true, force: true });
  };
  try {
    await healthy(`${prometheusBase}/-/ready`, prometheus.log);
    await healthy(`http://127.0.0.1:${healthPort}/`, collector.log);
  } catch (error) {
    await stop();
    throw error;
  }
  return { otlpEndpoint: `http://127.0.0.1:${otlpPort}`, prometheusBase, stop };
}

/** The stack as the pinned images on one network. */
async function inContainers(rules: string) {
  const network = await new Network().start();
  const prometheus = await new GenericContainer(PROMETHEUS_IMAGE)
    .withNetwork(network)
    .withNetworkAliases("prometheus")
    .withCopyContentToContainer([
      { content: rules, target: "/etc/prometheus/slo-rules.yml", mode: 0o644 },
      {
        content: prometheusConfig("/etc/prometheus/slo-rules.yml"),
        target: "/etc/prometheus/prometheus.yml",
        mode: 0o644,
      },
    ])
    .withCommand([
      "--config.file=/etc/prometheus/prometheus.yml",
      "--storage.tsdb.path=/prometheus",
      "--web.enable-otlp-receiver",
    ])
    .withExposedPorts(PROMETHEUS_PORT)
    .withWaitStrategy(Wait.forHttp("/-/ready", PROMETHEUS_PORT).forStatusCode(200))
    .start();
  const collector = await new GenericContainer(COLLECTOR_IMAGE)
    .withNetwork(network)
    .withCopyContentToContainer([
      {
        content: collectorConfig(
          "0.0.0.0",
          OTLP_PORT,
          HEALTH_PORT,
          `http://prometheus:${PROMETHEUS_PORT}`,
        ),
        target: "/etc/otelcol-contrib/config.yaml",
        mode: 0o644,
      },
    ])
    .withExposedPorts(OTLP_PORT, HEALTH_PORT)
    .withWaitStrategy(Wait.forHttp("/", HEALTH_PORT).forStatusCode(200))
    .start();
  return {
    otlpEndpoint: `http://${collector.getHost()}:${collector.getMappedPort(OTLP_PORT)}`,
    prometheusBase: `http://${prometheus.getHost()}:${prometheus.getMappedPort(PROMETHEUS_PORT)}`,
    stop: async () => {
      await collector.stop();
      await prometheus.stop();
      await network.stop();
    },
  };
}

/**
 * Starts the collector and Prometheus with `rules` loaded: the binaries the environment names, else the images.
 *
 * @example
 * const stack = await startSloStack(JSON.stringify(prometheusSloRules(plan)));
 * // ... a metrics driver exports to stack.otlpEndpoint ...
 * await stack.query('slo:sli_error:ratio_rate5m{slo_service="orders"}');
 * await stack.stop();
 */
export async function startSloStack(rules: string): Promise<SloStack> {
  const collectorBin = process.env["STACKRA_OTELCOL_BIN"] ?? "";
  const prometheusDir = process.env["STACKRA_PROMETHEUS_DIR"] ?? "";
  const stack =
    collectorBin !== "" && prometheusDir !== ""
      ? await asProcesses(collectorBin, prometheusDir, rules)
      : await inContainers(rules);
  return {
    otlpEndpoint: stack.otlpEndpoint,
    query: (expr) => instant(stack.prometheusBase, expr),
    stop: stack.stop,
  };
}
