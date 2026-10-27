/**
 * Stackra file contract:
 * Purpose: unit tests of `runEdiCase` over a sample connector of a made-up REST EDI network: a connector that matches
 *          its recording passes and returns the received documents; one that sends again instead of answering from
 *          its key, reads other documents or leaves a recorded call unmade fails with the case's name.
 * Boundary: test only. The sample connector names no vendor (ADR 0443 decision 8); real network connectors and their
 *           recordings live with the OS integrations connectors.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0443 (decision 8); ADR 0447 (decision 4); owner D3
 *                     2026-10-27.
 */
import { describe, expect, it } from "@stackra/testing";

import type { EdiConnector, EdiDocument, EdiDocumentPage } from "#contracts/index";
import type { IntegrationApi } from "#core/index";
import type { EdiCase } from "#testing/edi/edi-case.type";
import { runEdiCase } from "#testing/edi/run-edi-case.function";

/** A sample network: documents as JSON, the key as the idempotency key, an inbox with cursors. */
class RestNetworkEdi implements EdiConnector {
  readonly api: IntegrationApi;

  /** When set, posts without the idempotency key, so the second send is a new call. */
  readonly careless: boolean;

  constructor(api: IntegrationApi, careless = false) {
    this.api = api;
    this.careless = careless;
  }

  async send(document: EdiDocument, idempotencyKey: string): Promise<{ readonly id: string }> {
    const body = {
      type: document.type,
      partner: document.partner,
      reference: document.reference,
      body: document.body,
    };
    return this.api.post<{ id: string }>(
      "/documents",
      body,
      this.careless ? {} : { idempotencyKey },
    );
  }

  async receive(since: Date, cursor?: string): Promise<EdiDocumentPage> {
    const query = { since: since.toISOString(), ...(cursor === undefined ? {} : { cursor }) };
    const page = await this.api.get<{
      documents: {
        id: string;
        type: EdiDocument["type"];
        partner: string;
        reference: string;
        issuedAt: string;
      }[];
      next?: string;
    }>("/inbox", { query });
    const documents = page.documents.map((document) => ({
      ...document,
      issuedAt: new Date(document.issuedAt),
      body: {},
    }));
    return page.next === undefined ? { documents } : { documents, next: page.next };
  }

  async acknowledge(id: string): Promise<void> {
    await this.api.post(`/inbox/${id}/ack`, {});
  }
}

const order: EdiDocument = {
  type: "order",
  partner: "ZZ:ACMEFOODS",
  reference: "PO-1",
  issuedAt: new Date("2026-10-28T09:30:00Z"),
  body: { lines: 1 },
};
const sendCall = {
  method: "POST",
  path: "/documents",
  idempotencyKey: "po:1",
  body: { type: "order", partner: "ZZ:ACMEFOODS", reference: "PO-1", body: { lines: 1 } },
  answer: { id: "doc_1" },
} as const;
const invoice = {
  id: "doc_9",
  type: "invoice",
  partner: "ZZ:ACMEFOODS",
  reference: "INV-9",
} as const;
const recorded: EdiCase = {
  name: "order out, invoice in",
  certification: "pending",
  sends: [{ document: order, idempotencyKey: "po:1", id: "doc_1" }],
  since: new Date("2026-10-28T00:00:00Z"),
  received: [{ ...invoice, issuedAt: new Date("2026-10-29T08:00:00Z"), body: {} }],
  exchanges: [
    sendCall,
    sendCall,
    {
      method: "GET",
      path: "/inbox",
      query: { since: "2026-10-28T00:00:00.000Z" },
      answer: { documents: [], next: "c2" },
    },
    {
      method: "GET",
      path: "/inbox",
      query: { since: "2026-10-28T00:00:00.000Z", cursor: "c2" },
      answer: { documents: [{ ...invoice, issuedAt: "2026-10-29T08:00:00.000Z" }] },
    },
    { method: "POST", path: "/inbox/doc_9/ack", answer: {} },
  ],
};

describe("runEdiCase", () => {
  it("passes a connector that matches its recording", async () => {
    const documents = await runEdiCase((api) => new RestNetworkEdi(api), recorded);
    expect(documents.map((document) => document.reference)).toEqual(["INV-9"]);
  });

  it("fails a connector that drops the idempotency key", async () => {
    await expect(runEdiCase((api) => new RestNetworkEdi(api, true), recorded)).rejects.toThrow(
      TypeError,
    );
  });

  it("fails on other documents or a call left unmade", async () => {
    await expect(
      runEdiCase((api) => new RestNetworkEdi(api), { ...recorded, received: [] }),
    ).rejects.toThrow(/"order out, invoice in": the received documents differ/);
    await expect(
      runEdiCase((api) => new RestNetworkEdi(api), {
        ...recorded,
        exchanges: [...recorded.exchanges, { method: "GET", path: "/never" }],
      }),
    ).rejects.toThrow(/was never made/);
  });
});
