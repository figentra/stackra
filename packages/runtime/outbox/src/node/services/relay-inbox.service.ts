/**
 * Stackra file contract:
 * Purpose: `RelayInboxService`, the consumer's cross-app inbox: it takes one raw inbox request, verifies its sender
 *          before it reads the body as an event, reads the envelope, sets `producer` to the verified producer, and
 *          hands it to `InboxService.receive`, which claims the event id and runs the listeners in one transaction.
 *          It answers 204 when the event was handled, had been received, or is newer than this service reads (its
 *          producer also sends the older version under the same id); 401 when the sender is not verified; 422 when a
 *          verified body is not a valid envelope or event; 413 for a body over the limit; 405 for a method but POST.
 * Boundary: a service over `InboxVerifier`, `InboxService` and the `Clock`; gen's inbox route calls it with the raw
 *           request, outside session authentication (the signature authenticates it). A refusal records nothing and
 *           runs no listener; it logs the reason, never the body. Any other error propagates, so the route answers 5xx
 *           and the producer retries.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 11, 13, 16 and 18, amendment of 2026-11-02); ADR 0078 (decision 4).
 */
import type { Resolver } from "@stackra/actions";
import { Service } from "@stackra/container";
import { Logger } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";
import { ZodError } from "zod";

import type { CrossAppEnvelope, InboxVerifier } from "#contracts/index";
import { CROSS_APP_DEFAULTS } from "#core/constants/cross-app-defaults.constant";
import { CROSS_APP_ENVELOPE_SCHEMA } from "#core/constants/cross-app-envelope-schema.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";
import { UnknownEventError } from "#core/errors/unknown-event.error";
import type { InboxService } from "#node/services/inbox.service";

/**
 * Receives cross-app deliveries.
 *
 * @example
 * // generated: class InboundEventsController extends Controller({ path: "/events/inbox" }) {
 * //   handle(request: Request) { return this.inbox.receive(request); } }
 */
export class RelayInboxService extends Service {
  /** Verifies the sender. */
  private readonly verifier: InboxVerifier;

  /** Claims and handles the event. */
  private readonly inbox: InboxService;

  /** The time a request is verified at. */
  private readonly clock: Clock;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param verifier - the sender check.
   * @param inbox - the service's inbox.
   * @param clock - the time a signature's window is checked against.
   */
  constructor(verifier: InboxVerifier, inbox: InboxService, clock: Clock) {
    super();
    this.verifier = verifier;
    this.inbox = inbox;
    this.clock = clock;
  }

  /** Resolves the logger from `resolver` (a booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * Answers one inbox request.
   *
   * @throws Error from a listener (the claim rolls back with it), so the producer retries.
   */
  async receive(request: Request): Promise<Response> {
    if (request.method !== "POST") return new Response(null, { status: 405 });
    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > CROSS_APP_DEFAULTS.maxBodyBytes) return new Response(null, { status: 413 });
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > CROSS_APP_DEFAULTS.maxBodyBytes)
      return new Response(null, { status: 413 });
    const verdict = await this.verifier.verify(request.headers, body, this.clock.now());
    if (!verdict.verified) {
      this.logger()?.warn(OUTBOX_LOG_EVENTS.inboxRefused, { reason: verdict.reason });
      return new Response(null, { status: 401 });
    }
    let envelope: CrossAppEnvelope;
    try {
      envelope = Object.freeze({
        ...(CROSS_APP_ENVELOPE_SCHEMA.parse(JSON.parse(body)) as Omit<
          CrossAppEnvelope,
          "producer"
        >),
        producer: verdict.producer,
      });
    } catch {
      return new Response(null, { status: 422 });
    }
    try {
      await this.inbox.receive(envelope);
    } catch (error) {
      if (error instanceof UnknownEventError || error instanceof ZodError)
        return new Response(null, { status: 422 });
      throw error;
    }
    return new Response(null, { status: 204 });
  }

  /** The bound logger, when there is one. */
  private logger(): Logger | undefined {
    const resolver = this.resolver;
    return resolver?.has(Logger) === true ? resolver.get(Logger) : undefined;
  }
}
