/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientConnectionHostDriver`: each `ConnectionHost` method calls its configured ref with the
 *          service's input shape (the credentials' expiry on store) and maps the answer (items, an optional record, the
 *          access token).
 * Boundary: test only; the refs are local `remoteQuery`/`remoteAction` descriptors and the transport is a stub that
 *           records each request and answers by key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 12 and 20); ADR 0260 (decision 6).
 */
import { remoteAction, remoteQuery } from "@stackra/clients";
import { ClientTransport, type ClientRequest } from "@stackra/clients/contracts";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { ClientConnectionHostDriver } from "#core/drivers/client-connection-host.driver";
import type { ConnectionRecord } from "#core/types/connection-record.type";

const RECORD = {
  id: "conn_00000000000000000000000001",
  level: "scope",
  scope: { id: "scp_00000000000000000000000002", path: "root.shop" },
  fields: {},
  secrets: {},
  account: { id: "p-1" },
} as unknown as ConnectionRecord;

const ANY = z.any();
const CALLS = {
  resolve: remoteQuery("connections.connection.resolve@1", { input: ANY, output: ANY }),
  load: remoteQuery("connections.connection.load@1", { input: ANY, output: ANY }),
  store: remoteAction("connections.connection.store@1", { input: ANY, output: ANY }),
  disconnect: remoteAction("connections.connection.disconnect@1", { input: ANY, output: ANY }),
  token: remoteAction("connections.connection.token@1", { input: ANY, output: ANY }),
};

/** Records each request and answers by key. */
class StubTransport extends ClientTransport {
  readonly sent: ClientRequest[] = [];

  private readonly answers: Readonly<Record<string, unknown>>;

  constructor(answers: Readonly<Record<string, unknown>>) {
    super();
    this.answers = answers;
  }

  async send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return this.answers[request.key] ?? {};
  }

  async queue(): Promise<void> {}
}

/** A driver over a stub answering `answers`. */
function setup(answers: Readonly<Record<string, unknown>> = {}) {
  const transport = new StubTransport(answers);
  return { transport, host: new ClientConnectionHostDriver(transport, CALLS) };
}

describe("ClientConnectionHostDriver", () => {
  it("lists through resolve with the owners", async () => {
    const { transport, host } = setup({ "connections.connection.resolve@1": { items: [RECORD] } });
    await expect(host.list("sales.crm", { scope: RECORD.scope })).resolves.toEqual([RECORD]);
    expect(transport.sent[0]).toMatchObject({
      kind: "query",
      input: { integrationKey: "sales.crm", scope: RECORD.scope },
    });
  });

  it("gets through load and answers null without a record", async () => {
    const { host } = setup({ "connections.connection.load@1": { record: RECORD } });
    await expect(host.get("sales.crm", RECORD.id)).resolves.toEqual(RECORD);
    await expect(setup().host.get("sales.crm", RECORD.id)).resolves.toBeNull();
  });

  it("stores the record with its tokens and the credentials' expiry", async () => {
    const { transport, host } = setup();
    await host.store(
      "sales.crm",
      RECORD,
      { accessToken: "at", refreshToken: "rt" },
      new Date("2027-01-01T00:00:00Z"),
    );
    expect(transport.sent[0]).toMatchObject({
      key: "connections.connection.store@1",
      input: {
        integrationKey: "sales.crm",
        tokens: { accessToken: "at", refreshToken: "rt" },
        credentialsExpireAt: "2027-01-01T00:00:00.000Z",
      },
    });
  });

  it("disconnects and asks for an access token", async () => {
    const { transport, host } = setup({
      "connections.connection.token@1": { accessToken: "fresh" },
    });
    await host.disconnect("sales.crm", RECORD.id);
    await expect(host.accessToken("sales.crm", RECORD.id)).resolves.toBe("fresh");
    expect(transport.sent.map((request) => request.input)).toEqual([
      { id: RECORD.id, integrationKey: "sales.crm" },
      { integrationKey: "sales.crm", id: RECORD.id },
    ]);
  });
});
