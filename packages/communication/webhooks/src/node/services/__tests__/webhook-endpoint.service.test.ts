/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookEndpointService`: register stores an enabled endpoint of the scope with its secret name
 *          and refuses a URL that is not https or an empty subscription; subscribedTo reads the scope's enabled
 *          endpoints and keeps those subscribed to the event; rotate keeps the replaced secret name with the rotation
 *          time; disable stops an enabled endpoint once and ignores a removed one; an `s3:` target registers and a bad
 *          one is refused; a gated event is registered and delivered only with its grant, fail closed with no source.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224; ADR 0308 (rule 17); ADR 0327 (decisions 3 and 9); ADR 0422
 *                     (decision 4).
 */
import { InputInvalidError } from "@stackra/actions";
import type { ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { EntitlementRequiredError } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { MemoryWebhookEntitlementSourceDriver } from "#core/drivers/memory-webhook-entitlement-source.driver";
import { OUTBOUND_EVENT_ENTITLEMENTS } from "#node/constants/outbound-event-entitlements.constant";
import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

registerModelPartners([[WebhookEndpointService, WebhookEndpoint]]);
OUTBOUND_EVENT_ENTITLEMENTS.set("records.audit_record.appended.v1", "records.audit_evidence");

const SIEM = "records.audit_record.appended.v1";

const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const AT = new Date("2026-10-25T09:00:00Z");

/** A stored endpoint with `data`. */
const endpointOf = (data: Partial<WebhookEndpoint>): WebhookEndpoint =>
  Object.assign(new WebhookEndpoint(), {
    scopeId: ACME.id,
    scopePath: ACME.path,
    url: "https://hooks.acme.example/in",
    events: ["orders.order.paid.v1"],
    secretName: "ACME_WEBHOOK_SECRET_1",
    previousSecretName: null,
    rotatedAt: null,
    disabledAt: null,
    ...data,
  });

/** Connects a recording entity manager whose `find` answers `rows` and `findOne` answers `one`. */
function connect(rows: WebhookEndpoint[] = [], one: WebhookEndpoint | null = null) {
  const em = {
    find: vi.fn(async (_model: unknown, _where: object) => rows),
    findOne: vi.fn(async (_model: unknown, _where: object) => one),
    findOneOrFail: vi.fn(async () => {
      if (one === null) throw new TypeError("no row");
      return one;
    }),
    create: vi.fn((_model: unknown, data: object) => Object.assign(new WebhookEndpoint(), data)),
    assign: vi.fn((row: object, data: object) => Object.assign(row, data)),
    flush: vi.fn(async () => undefined),
    transactional: vi.fn(async (work: (manager: unknown) => Promise<unknown>) => work(em)),
  };
  vi.spyOn(Database, "current").mockReturnValue({
    em: () => em as unknown as ReturnType<Database["em"]>,
  } as unknown as Database);
  return em;
}

/** What `register` throws for `url` and `events`; it throws before anything is stored. */
function refusalOf(
  url: string,
  events: readonly string[],
  service = new WebhookEndpointService(),
): Promise<unknown> {
  return service.register({ scope: ACME, url, events, secretName: "S" }).then(
    () => undefined,
    (error: unknown) => error,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe(WebhookEndpointService, () => {
  it("registers an enabled endpoint of the scope with its secret name", async () => {
    const em = connect();
    const endpoint = await new WebhookEndpointService().register({
      scope: ACME,
      url: "https://hooks.acme.example/in",
      events: ["orders.order.paid.v1"],
      secretName: "ACME_WEBHOOK_SECRET_1",
    });
    expect(em.create.mock.calls[0]?.[1]).toEqual({
      scopeId: ACME.id,
      scopePath: ACME.path,
      url: "https://hooks.acme.example/in",
      events: ["orders.order.paid.v1"],
      secretName: "ACME_WEBHOOK_SECRET_1",
      previousSecretName: null,
      rotatedAt: null,
      disabledAt: null,
    });
    expect(endpoint).toBeInstanceOf(WebhookEndpoint);
    expect(em.flush).toHaveBeenCalled();
  });

  it("refuses a URL that is not https and an empty subscription", async () => {
    const em = connect();
    const plain = await refusalOf("http://hooks.acme.example/in", ["orders.order.paid.v1"]);
    expect(plain).toBeInstanceOf(InputInvalidError);
    expect((plain as InputInvalidError).fieldErrors).toEqual({ url: "webhook_url_invalid" });
    expect(
      ((await refusalOf("s3://Bad_Bucket/x", ["orders.order.paid.v1"])) as InputInvalidError)
        .fieldErrors,
    ).toEqual({
      url: "webhook_url_invalid",
    });
    expect(em.create).not.toHaveBeenCalled();
    expect(((await refusalOf("hooks", [])) as InputInvalidError).fieldErrors).toEqual({
      url: "webhook_url_invalid",
      events: "webhook_events_empty",
    });
  });

  it("finds the scope's enabled endpoints subscribed to the event", async () => {
    const paid = endpointOf({});
    const other = endpointOf({ events: ["orders.order.placed.v1"] });
    const em = connect([paid, other]);
    await expect(
      new WebhookEndpointService().subscribedTo(ACME.id, "orders.order.paid.v1"),
    ).resolves.toEqual([paid]);
    expect(em.find.mock.calls[0]?.[1]).toEqual({ scopeId: ACME.id, disabledAt: null });
  });

  it("rotates the signing secret and keeps the replaced name with the time", async () => {
    const endpoint = endpointOf({});
    connect([], endpoint);
    await new WebhookEndpointService().rotate(endpoint.id, "ACME_WEBHOOK_SECRET_2", AT);
    expect(endpoint).toMatchObject({
      secretName: "ACME_WEBHOOK_SECRET_2",
      previousSecretName: "ACME_WEBHOOK_SECRET_1",
      rotatedAt: AT,
    });
  });

  it("disables an enabled endpoint once and leaves a removed one", async () => {
    const endpoint = endpointOf({});
    const em = connect([], endpoint);
    await new WebhookEndpointService().disable(endpoint.id, AT);
    expect(endpoint.disabledAt).toEqual(AT);
    await new WebhookEndpointService().disable(endpoint.id, new Date());
    expect(endpoint.disabledAt).toEqual(AT);
    expect(em.assign).toHaveBeenCalledTimes(1);
    connect([], null);
    await expect(
      new WebhookEndpointService().disable("whe_00000000000000000000000000", AT),
    ).resolves.toBeUndefined();
  });

  it("registers an s3 target", async () => {
    const em = connect();
    await new WebhookEndpointService().register({
      scope: ACME,
      url: "s3://acme-siem/stackra?region=me-central-1",
      events: ["orders.order.paid.v1"],
      secretName: "S",
    });
    expect(em.create.mock.calls[0]?.[1]).toMatchObject({
      url: "s3://acme-siem/stackra?region=me-central-1",
    });
  });

  it("registers a gated event only with its grant, and fails closed with no source", async () => {
    const em = connect();
    const entitlements = new MemoryWebhookEntitlementSourceDriver();
    const refused = await refusalOf(
      "https://siem.acme.example/in",
      [SIEM],
      new WebhookEndpointService(entitlements),
    );
    expect(refused).toBeInstanceOf(EntitlementRequiredError);
    expect((refused as EntitlementRequiredError).fieldErrors).toEqual({
      events: "entitlement_required",
    });
    expect(await refusalOf("https://siem.acme.example/in", [SIEM])).toBeInstanceOf(
      EntitlementRequiredError,
    );
    expect(em.create).not.toHaveBeenCalled();
    entitlements.grant(ACME.id, "records.audit_evidence");
    await expect(
      refusalOf("https://siem.acme.example/in", [SIEM], new WebhookEndpointService(entitlements)),
    ).resolves.toBeUndefined();
  });

  it("delivers a gated event only while the scope holds its grant", async () => {
    const siem = endpointOf({ events: [SIEM] });
    connect([siem]);
    const entitlements = new MemoryWebhookEntitlementSourceDriver().grant(
      ACME.id,
      "records.audit_evidence",
    );
    const service = new WebhookEndpointService(entitlements);
    await expect(service.subscribedTo(ACME.id, SIEM)).resolves.toEqual([siem]);
    entitlements.revoke(ACME.id, "records.audit_evidence");
    await expect(service.subscribedTo(ACME.id, SIEM)).resolves.toEqual([]);
    await expect(new WebhookEndpointService().subscribedTo(ACME.id, SIEM)).resolves.toEqual([]);
  });
});
