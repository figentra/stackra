/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookDeliveryService`: an attempt is stored as given, in a transaction of its own.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224 (decision 3).
 */
import { Database, registerModelPartners } from "@stackra/database";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebhookDelivery } from "#node/models/webhook-delivery.model";
import { WebhookDeliveryService } from "#node/services/webhook-delivery.service";

registerModelPartners([[WebhookDeliveryService, WebhookDelivery]]);

afterEach(() => {
  vi.restoreAllMocks();
});

describe(WebhookDeliveryService, () => {
  it("records an attempt in a transaction of its own", async () => {
    const em = {
      create: vi.fn((_model: unknown, data: object) => Object.assign(new WebhookDelivery(), data)),
      flush: vi.fn(async () => undefined),
      transactional: vi.fn(
        async (work: (manager: unknown) => Promise<unknown>, _options?: object) => work(em),
      ),
    };
    vi.spyOn(Database, "current").mockReturnValue({
      em: () => em as unknown as ReturnType<Database["em"]>,
    } as unknown as Database);
    const attempt = {
      endpointId: "whe_00000000000000000000000001",
      scopeId: "scp_00000000000000000000000001",
      scopePath: "platform.acme",
      eventId: "evt_1",
      eventType: "orders.order.paid.v1",
      responseStatus: 500,
      isDelivered: false,
    } as const;
    const row = await new WebhookDeliveryService().record(attempt);
    expect(row).toMatchObject(attempt);
    expect(em.create).toHaveBeenCalledWith(WebhookDelivery, attempt);
    // MikroORM's TransactionPropagation.REQUIRES_NEW; this package never imports the ORM (ADR 0097)
    expect(em.transactional.mock.calls[0]?.[1]).toEqual({ propagation: "requires_new" });
  });
});
