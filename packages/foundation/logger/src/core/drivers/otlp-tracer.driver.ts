/**
 * Stackra file contract:
 * Purpose: the OTLP driver of the `Tracer` port (driver name `otlp`): spans nest under the current span, continue an
 *          inbound W3C trace, carry the edge's request id, and are batched and POSTed as OTLP/JSON to
 *          `<endpoint>/v1/traces`.
 * Boundary: no vendor SDK: web-standard `fetch` and WebCrypto only. The current span follows `await` through
 *           `AsyncLocalStorage`, taken with `process.getBuiltinModule` so no `node:` import reaches a bundle (Node, and
 *           Workers with node compatibility); where there is none (a browser), every span is a root and
 *           `continueTrace` only runs its work. A new trace is sampled at `traceSampleRatio`; a continued one follows
 *           its caller's flag; an unsampled span still propagates, and is never sent. Sending never throws into the
 *           traced work (dropped and counted, as the log reporter does). `flush()` and shutdown send what is queued.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decision 1: OpenTelemetry, OTLP for every signal); ADR 0147 (decisions 1 and 3); ADR
 *                     0173 (secrets by name); W3C Trace Context.
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";
import { Tracer } from "@stackra/contracts";
import type { TraceAttributes, TraceCarrier, TraceSpan } from "@stackra/contracts";

import type { OtlpConfig } from "#config/otlp.config";
import { formatTraceparent } from "#core/functions/format-traceparent.function";
import { otlpExporter } from "#core/functions/otlp-exporter.function";
import { otlpTracesBody } from "#core/functions/otlp-traces-body.function";
import { parseTraceparent } from "#core/functions/parse-traceparent.function";
import type { FinishedSpan } from "#core/types/finished-span.type";
import type { OtlpExporter } from "#core/types/otlp-exporter.type";
import type { SpanContext } from "#core/types/span-context.type";

/** What the async context holds: the inbound call's carrier, then its current span. */
interface Active {
  readonly carrier?: TraceCarrier;
  readonly span?: SpanContext;
  readonly requestId?: string;
}

/** The part of `AsyncLocalStorage` this driver uses. */
interface ContextStore {
  run: <R>(store: Active, work: () => R) => R;
  getStore: () => Active | undefined;
}

/** A fresh `AsyncLocalStorage`, or `undefined` where the runtime has none. */
function asyncContext(): ContextStore | undefined {
  const runtime = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } })
    .process;
  const hooks = runtime?.getBuiltinModule?.("node:async_hooks") as
    | { AsyncLocalStorage?: new () => ContextStore }
    | undefined;
  return hooks?.AsyncLocalStorage === undefined ? undefined : new hooks.AsyncLocalStorage();
}

/** `bytes` random bytes as lower-case hex. */
function randomHex(bytes: number): string {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/** The type a failed span records: the error's `code`, else its class name. */
function errorType(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code === "string" && code !== "") return code;
  return error instanceof Error ? error.name : typeof error;
}

/**
 * Sends spans to an OpenTelemetry collector.
 *
 * @example
 * // runway.yaml (production): config.logger.otlp: { endpoint: https://otlp.example.test, serviceName: orders }
 * await tracer.continueTrace({ traceparent, requestId }, () =>
 *   tracer.span("action orders.order.create@1", { action: key }, async () => run()),
 * );
 * await tracer.flush();
 */
export class OtlpTracerDriver extends Driver(Tracer) {
  private readonly config: OtlpConfig;

  private readonly exporter: OtlpExporter<FinishedSpan>;

  private readonly context = asyncContext();

  /**
   * @param config - the collector, the service name, the headers secret's name, the batching bounds and the ratio.
   * @param secrets - the store the headers are read from.
   */
  constructor(config: OtlpConfig, secrets: SecretStore) {
    super();
    this.config = config;
    this.exporter = otlpExporter(config, secrets, "traces", (batch) =>
      otlpTracesBody(batch, config.serviceName),
    );
  }

  /** Spans dropped so far (queue overflow, or a batch the collector refused or never answered). */
  get dropped(): number {
    return this.exporter.dropped;
  }

  /** Sends what is queued before the container closes. */
  onApplicationShutdown(): Promise<void> {
    return this.flush();
  }

  /** Runs `work` in a span under the current one, ends it when `work` settles and queues it when sampled. */
  async span<T>(
    name: string,
    attributes: TraceAttributes,
    work: (span: TraceSpan) => Promise<T>,
  ): Promise<T> {
    const active = this.context?.getStore();
    const remote =
      active?.span === undefined ? parseTraceparent(active?.carrier?.traceparent) : undefined;
    const parent = active?.span ?? remote;
    const requestId = active?.requestId ?? active?.carrier?.requestId;
    const context: SpanContext = {
      traceId: parent?.traceId ?? randomHex(16),
      spanId: randomHex(8),
      sampled: parent?.sampled ?? Math.random() < this.config.traceSampleRatio,
    };
    const recorded: Record<string, string | number | boolean> = {
      ...attributes,
      ...(requestId === undefined ? {} : { requestId }),
    };
    let failed: string | undefined;
    const handle: TraceSpan = {
      set: (more) => Object.assign(recorded, more),
      fail: (error) => {
        failed = errorType(error);
      },
    };
    const startMs = Date.now();
    const run = (): Promise<T> => work(handle);
    try {
      return await (this.context === undefined
        ? run()
        : this.context.run(
            { span: context, ...(requestId === undefined ? {} : { requestId }) },
            run,
          ));
    } catch (error) {
      failed ??= errorType(error);
      throw error;
    } finally {
      if (context.sampled)
        this.exporter.push({
          name,
          context,
          ...(parent === undefined ? {} : { parentSpanId: parent.spanId }),
          kind: remote === undefined ? "internal" : "server",
          startMs,
          endMs: Date.now(),
          attributes: recorded,
          ...(failed === undefined ? {} : { error: failed }),
        });
    }
  }

  /** Runs `work` as one inbound call; its first span reads `carrier` when it starts. */
  continueTrace<T>(carrier: TraceCarrier, work: () => Promise<T>): Promise<T> {
    return this.context === undefined ? work() : this.context.run({ carrier }, work);
  }

  /** The current span's `traceparent`, else the inbound call's own, else `undefined`. */
  traceparent(): string | undefined {
    const active = this.context?.getStore();
    if (active?.span !== undefined) return formatTraceparent(active.span);
    const inbound = parseTraceparent(active?.carrier?.traceparent);
    return inbound === undefined ? undefined : formatTraceparent(inbound);
  }

  /** Sends every queued span and resolves once all sends have finished or failed. */
  flush(): Promise<void> {
    return this.exporter.flush();
  }
}
