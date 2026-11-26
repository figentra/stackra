/**
 * Stackra file contract:
 * Purpose: `TicketTriageService`, the example service of the "Observability" guide: it routes a new ticket to a queue
 *          inside its own span, counts and times the routing, and logs one structured line, all through the contracts
 *          ports, so the same code reports to the console locally and to the OTLP collector when deployed.
 * Boundary: ids and codes only in spans, metrics and logs, never a person's data; which driver sends them is
 *           configuration (`logger.logging.reporter`, the `Tracer` and `Metrics` drivers), never this code.
 * Runtime: node
 * Governing contract: ADR 0147 (decision 3: spans carry ids and codes); ADR 0184 (logs, traces and metrics over OTLP);
 *                     ADR 0020; STA-2852.
 */
import { Service } from "@stackra/container";
import type { Logger, Metrics, Tracer } from "@stackra/contracts";

/** Routes new tickets, observably. */
export class TicketTriageService extends Service {
  /** Structured logs. */
  private readonly logger: Logger;

  /** Counters and histograms. */
  private readonly metrics: Metrics;

  /** Spans. */
  private readonly tracer: Tracer;

  /**
   * @param logger - structured logs.
   * @param metrics - counters and histograms.
   * @param tracer - spans.
   */
  constructor(logger: Logger, metrics: Metrics, tracer: Tracer) {
    super();
    this.logger = logger;
    this.metrics = metrics;
    this.tracer = tracer;
  }

  /** The queue a ticket goes to: `on_call` for an urgent one, `general` otherwise. */
  triage(ticketId: string, priority: string): Promise<string> {
    return this.tracer.span("support.triage", { ticketId, priority }, async (span) => {
      const started = performance.now();
      const queue = priority === "urgent" ? "on_call" : "general";
      span.set({ queue });
      this.metrics.counter("support.tickets_triaged", 1, { queue });
      this.metrics.histogram("support.triage_ms", performance.now() - started, { queue });
      this.logger.info("support.ticket_triaged", { ticketId, queue });
      return queue;
    });
  }
}
