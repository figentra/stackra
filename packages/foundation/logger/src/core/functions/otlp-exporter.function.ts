/**
 * Stackra file contract:
 * Purpose: `otlpExporter(config, secrets, signal, encode)`, the batching OTLP/HTTP sender of the log reporter, the
 *          tracer and the metrics driver: items are POSTed as OTLP/JSON to `<endpoint>/v1/<signal>`, a full batch at
 *          once and the rest after `flushIntervalMs`.
 * Boundary: no vendor SDK: web-standard `fetch` only, so it runs in a service and a Worker. `push` never throws: a
 *           batch that fails to encode or send, or that the collector answers with a non-2xx status, is dropped and
 *           counted; past `maxQueue` the oldest items are dropped and counted, so a dead collector never grows memory
 *           without bound. The headers secret is read once through the `SecretStore` port. With no endpoint nothing
 *           is queued. `flush()` sends what is queued and waits for every send.
 * Runtime: isomorphic
 * Governing contract: ADR 0184 (decisions 1, 2 and 5); ADR 0147 (decision 1: OTLP driver); ADR 0173 (secrets by name).
 */
import type { SecretStore } from "@stackra/config/contracts";

import type { OtlpConfig } from "#config/otlp.config";
import { otlpHeaders } from "#core/functions/otlp-headers.function";
import type { OtlpExporter } from "#core/types/otlp-exporter.type";

/**
 * Builds the sender of one signal.
 *
 * @example
 * const spans = otlpExporter(config, secrets, "traces", (batch) => otlpTracesBody(batch, config.serviceName));
 * spans.push(span);
 * await spans.flush();
 */
export function otlpExporter<T>(
  config: OtlpConfig,
  secrets: SecretStore,
  signal: "logs" | "traces" | "metrics",
  encode: (batch: readonly T[]) => object,
): OtlpExporter<T> {
  const queue: T[] = [];
  const inFlight = new Set<Promise<void>>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let headers: Readonly<Record<string, string>> | undefined;
  let dropped = 0;

  const schedule = (): void => {
    if (timer !== undefined) return;
    timer = setTimeout(send, config.flushIntervalMs);
    // A pending flush must not keep a Node process alive; Workers and browsers have no `unref`.
    (timer as { unref?: () => void }).unref?.();
  };

  function send(): void {
    clearTimeout(timer);
    timer = undefined;
    const batch = queue.splice(0, config.batchSize);
    if (batch.length === 0) return;
    const drop = (): void => {
      dropped += batch.length;
    };
    try {
      headers ??= otlpHeaders(secrets.get(config.headersSecret));
      const sent = globalThis
        .fetch(`${config.endpoint.replace(/\/+$/, "")}/v1/${signal}`, {
          method: "POST",
          headers: { ...headers, "content-type": "application/json" },
          body: JSON.stringify(encode(batch)),
        })
        .then((response: Response | undefined) => {
          if (response?.ok !== true) drop();
        }, drop);
      inFlight.add(sent);
      void sent.finally(() => inFlight.delete(sent));
    } catch {
      // A throwing encode or fetch drops the batch; telemetry never fails its caller.
      drop();
    }
    if (queue.length > 0) schedule();
  }

  return {
    push(item: T): void {
      if (config.endpoint === "") return;
      queue.push(item);
      if (queue.length > config.maxQueue) {
        dropped += queue.length - config.maxQueue;
        queue.splice(0, queue.length - config.maxQueue);
      }
      if (queue.length >= config.batchSize) {
        send();
        return;
      }
      schedule();
    },
    async flush(): Promise<void> {
      while (queue.length > 0) send();
      await Promise.all(inFlight);
    },
    get dropped(): number {
      return dropped;
    },
  };
}
