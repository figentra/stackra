/**
 * Stackra file contract:
 * Purpose: `RelayInboxService`, the consumer side of a cross-app delivery: the generated `POST /events/inbox` route
 *          hands it the raw request; it verifies the sender (`InboxVerifier`) before anything reads the body, parses
 *          the cross-app envelope, sets `producer` from the verified sender (never from the body) and hands it to
 *          `InboxService.receive`, which claims the event id and runs the listeners in one transaction. It answers 204
 *          when handled, already received or a newer version this process waits on; 401 when unverified (the reason is
 *          logged, never the body); 405 for a method other than POST; 422 when the envelope or its data breaks its
 *          schema, or names an event this process does not know (nothing recorded).
 * Boundary: a platform service over `InboxService` and the `InboxVerifier` port. A listener that throws propagates, so
 *           the route answers a 5xx and the producer retries (the claim rolled back with the transaction). `connect`
 *           is optional: it gives the logger.
 * Runtime: node
 * Governing contract: ADR 0511 (decisions 11, 13, 18 and 19, amendment of 2026-11-02); ADR 0078 (decision 4).
 */
import type { Resolver } from "@stackra/actions";
import { Service } from "@stackra/container";
import { Logger } from "@stackra/contracts";
import { z } from "zod";

import type { CrossAppEnvelope, InboxRequest, InboxVerifier } from "#contracts/index";
import { CROSS_APP_ENVELOPE_SCHEMA } from "#core/constants/cross-app-envelope-schema.constant";
import { OUTBOX_LOG_EVENTS } from "#core/constants/outbox-log-events.constant";
import { UnknownEventError } from "#core/errors/unknown-event.error";
import type { InboxService } from "#node/services/inbox.service";

/**
 * Receives cross-app deliveries.
 *
 * @example
 * // in the generated inbox route
 * return new Response(null, { status: await relayInbox.receive({ method, headers, body }) });
 */
export class RelayInboxService extends Service {
  /** Claims the event id and runs the listeners. */
  private readonly inbox: InboxService;

  /** Verifies the sender. */
  private readonly verifier: InboxVerifier;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param inbox - the service's inbox.
   * @param verifier - the sender verification.
   */
  constructor(inbox: InboxService, verifier: InboxVerifier) {
    super();
    this.inbox = inbox;
    this.verifier = verifier;
  }

  /** Resolves the logger from `resolver` (a booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * Handles one inbox request.
   *
   * @returns the HTTP status to answer.
   * @throws Error what a listener threw (answer a 5xx; the producer retries).
   */
  async receive(request: InboxRequest): Promise<204 | 401 | 405 | 422> {
    if (request.method.toUpperCase() !== "POST") return 405;
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(request.headers))
      if (value !== undefined)
        headers[name.toLowerCase()] = typeof value === "string" ? value : value.join(" ");
    const verdict = await this.verifier.verify(headers, request.body);
    if (!verdict.verified) {
      this.logger()?.warn(OUTBOX_LOG_EVENTS.inboxUnverified, { reason: verdict.reason });
      return 401;
    }
    const text =
      typeof request.body === "string" ? request.body : new TextDecoder().decode(request.body);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return this.invalid(verdict.sender.service, "json");
    }
    const parsed = CROSS_APP_ENVELOPE_SCHEMA.safeParse(json);
    if (!parsed.success) return this.invalid(verdict.sender.service, "envelope");
    const envelope: CrossAppEnvelope = {
      ...(parsed.data as Omit<CrossAppEnvelope, "producer">),
      producer: verdict.sender.service,
    };
    try {
      await this.inbox.receive(envelope);
    } catch (error) {
      if (error instanceof z.ZodError) return this.invalid(envelope.producer, "data", envelope);
      if (error instanceof UnknownEventError)
        return this.invalid(envelope.producer, "unknown_event", envelope);
      throw error;
    }
    return 204;
  }

  /** Logs a verified request refused for `reason` (ids only) and answers 422. */
  private invalid(producer: string | undefined, reason: string, envelope?: CrossAppEnvelope): 422 {
    this.logger()?.warn(OUTBOX_LOG_EVENTS.inboxInvalid, {
      producer,
      reason,
      ...(envelope === undefined ? {} : { eventId: envelope.id, type: envelope.type }),
    });
    return 422;
  }

  /** The bound logger, when there is one. */
  private logger(): Logger | undefined {
    const resolver = this.resolver;
    return resolver?.has(Logger) === true ? resolver.get(Logger) : undefined;
  }
}
