/**
 * Stackra file contract:
 * Purpose: `ServiceAcked`, the cross-service "service acked" contract: one service says it finished its part of a
 *          subject another service's workflow waits on (tenant provisioning: commerce created the tenant's catalogue,
 *          ADR 0210 decision 6). It carries the subject and the acking service's member key.
 * Boundary: an integration event, so it leaves the acking service through its outbox in the transaction that did the
 *           work and reaches the waiting service through the transport. The waiting service's `WorkflowExplorer` hands
 *           each one to `ServiceAckService.ack`, which holds `AllServicesAcked` once every expected service acked. It
 *           carries no result of the work: the waiting workflow reads that through each service's client.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (decision 6); ADR 0427 (decision 1); ADR 0141 (event names); ADR 0305 (rules 19 and
 *                     21).
 */
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { SERVICE_ACKED_SCHEMA } from "#core/constants/service-acked-schema.constant";

/**
 * One service's ack.
 *
 * @example
 * ctx.record(ServiceAcked.create({ subject: input.tenantId, service: "commerce" }));
 */
export class ServiceAcked extends IntegrationEvent({ name: "service.acked" }) {
  /** What was acked: the id the waiting workflow expects acks for (a tenant's public id). */
  subject!: string;

  /** The acking service's member key (`commerce`). */
  service!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ServiceAcked, SERVICE_ACKED_SCHEMA]]);
