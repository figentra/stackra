/**
 * Stackra file contract:
 * Purpose: unit tests of `ClientReplicaSourceDriver`: a refresh goes through the transport to the replica query's
 *          route with the slice and the cursor as its input (no cursor on the first fill), answers the server's
 *          changes, and rejects an unloaded query or an answer that is not a replica's.
 * Boundary: test only; the transport is a stand-in and the query is a generated-style ref.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0338 (decision 3).
 */
import { HttpMethod } from "@stackra/contracts";
import { ReplicaSource } from "@stackra/query/contracts";
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { ClientReplicaSourceDriver } from "#core/drivers/client-replica-source.driver";
import { queryRef } from "#core/functions/query-ref.function";

queryRef("sales.sale.recent@1", {
  input: z.object({ legalEntityId: z.string(), cursor: z.string().optional() }),
  output: z.object({ cursor: z.string() }),
  http: { method: HttpMethod.Get, path: "/sales/recent" },
  replica: { of: "sales.sale", window: "30d", limit: 50, scope: "legalEntityId" },
});

const CHANGES = {
  rows: [{ id: "sal_1", at: "2026-10-24T09:00:00.000Z", data: { legalEntityId: "len_1" } }],
  removed: ["sal_0"],
  cursor: "c_2",
  asOf: "2026-10-24T09:00:00.000Z",
  full: false,
};

/** A transport that records the request and answers `answer`. */
class StubTransport extends ClientTransport {
  readonly sent: ClientRequest[] = [];

  private readonly answer: unknown;

  constructor(answer: unknown) {
    super();
    this.answer = answer;
  }

  send(request: ClientRequest): Promise<unknown> {
    this.sent.push(request);
    return Promise.resolve(this.answer);
  }

  queue(): Promise<void> {
    return Promise.resolve();
  }
}

describe("ClientReplicaSourceDriver", () => {
  it("asks the replica query with the slice and the cursor, and answers the changes", async () => {
    const transport = new StubTransport(CHANGES);
    const source = new ClientReplicaSourceDriver(transport);
    expect(source).toBeInstanceOf(ReplicaSource);
    expect(await source.changes("sales.sale.recent@1", "c_1", { legalEntityId: "len_1" })).toEqual(
      CHANGES,
    );
    expect(transport.sent[0]).toMatchObject({
      key: "sales.sale.recent@1",
      kind: "query",
      endpoint: { method: "GET", path: "/sales/recent" },
      input: { legalEntityId: "len_1", cursor: "c_1" },
    });
  });

  it("sends no cursor on the first fill", async () => {
    const transport = new StubTransport({ ...CHANGES, removed: [], full: true });
    await new ClientReplicaSourceDriver(transport).changes("sales.sale.recent@1", null, {});
    expect(transport.sent[0]?.input).toEqual({});
  });

  it("rejects a query no loaded ref has, and an answer that is not a replica's", async () => {
    const source = new ClientReplicaSourceDriver(new StubTransport({ rows: "none" }));
    await expect(source.changes("sales.sale.unknown@1", null, {})).rejects.toThrow(TypeError);
    await expect(source.changes("sales.sale.recent@1", null, {})).rejects.toThrow();
  });
});
