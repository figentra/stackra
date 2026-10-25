/**
 * Stackra file contract:
 * Purpose: unit tests of `WebhookEndpointService`: register stores an enabled endpoint of the scope with its secret name
 *          and refuses a URL that is not https or an empty subscription; subscribedTo reads the scope's enabled
 *          endpoints and keeps those subscribed to the event; rotate keeps the replaced secret name with the rotation
 *          time; disable stops an enabled endpoint once and ignores a removed one.
 * Boundary: test only; a fake `Database` hands out a recording entity manager, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0224; ADR 0308 (rule 17); ADR 0327 (decisions 3 and 9).
 */
import { InputInvalidError } from "@stackra/actions";
import type { ScopeRef } from "@stackra/contracts";
import { Database, registerModelPartners } from "@stackra/database";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

registerModelPartners([[WebhookEndpointService, WebhookEndpoint]]);

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
function refusalOf(url: string, events: readonly string[]): unknown {
  try {
    void new WebhookEndpointService().register({ scope: ACME, url, events, secretName: "S" });
  } catch (error) {
    return error;
  }
  return undefined;
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

  it("refuses a URL that is not https and an empty subscription", () => {
    connect();
    const plain = refusalOf("http://hooks.acme.example/in", ["orders.order.paid.v1"]);
    expect(plain).toBeInstanceOf(InputInvalidError);
    expect((plain as InputInvalidError).fieldErrors).toEqual({ url: "webhook_url_invalid" });
    expect((refusalOf("hooks", []) as InputInvalidError).fieldErrors).toEqual({
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
});
