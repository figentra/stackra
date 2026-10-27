/**
 * Stackra file contract:
 * Purpose: unit tests of `DocumensoConnection` and `DocumensoIntegration`: the key is a secret, `check` lists one
 *          document, `send` creates, uploads and sends once per reference and refuses a signer without email, Documenso's
 *          states map onto `SignatureStatus`, `download` only when signed, `cancel` only while open, a 404 is not found.
 * Boundary: test only; the managed client is `fakeIntegrationApi` with recorded Documenso API v1 answers, and `fetch`
 *           (the presigned storage URLs) is stubbed. No Documenso instance is called.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0365 (decision 5); ADR 0308.
 */
import { Secret } from "@stackra/config";
import { kindOf } from "@stackra/container";
import { ProviderRefusedError, ProviderUnavailableError } from "@stackra/integrations";
import { fakeIntegrationApi, makeConnection } from "@stackra/integrations/testing";
import type { FakeIntegrationRoutes } from "@stackra/integrations/testing";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { SignatureStatus } from "#contracts/enums/signature-status.enum";
import { DocumensoConnection } from "#core/drivers/documenso.connection";
import { DocumensoIntegration } from "#core/drivers/documenso.integration";
import { SignatureEnvelopeClosedError } from "#core/errors/signature-envelope-closed.error";
import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";
import { SignatureNotCompleteError } from "#core/errors/signature-not-complete.error";
import { SignatureSignerUnreachableError } from "#core/errors/signature-signer-unreachable.error";

const request = {
  reference: "frm_1",
  title: "Consent",
  document: new Uint8Array([0x25, 0x50]),
  contentHash: "sha256:00",
  signers: [
    { name: "A", email: "a@acme.example", order: 1 },
    { name: "B", email: "b@acme.example", order: 2 },
  ],
  locale: "ar-SA",
};

/** A connection over the routes `configure` declares. */
function connectionOf(configure: (routes: FakeIntegrationRoutes) => unknown) {
  return makeConnection(DocumensoConnection, {
    api: fakeIntegrationApi(DocumensoIntegration, configure),
    fields: { host: "sign.acme.example", apiKey: "api_test", timeoutMs: 5000 },
  });
}

/** A recorded `GET /documents/:id` answer. */
const document =
  (status: string, recipients: object[] = [], completedAt?: string) =>
  () => ({
    id: 42,
    externalId: "frm_1",
    status,
    recipients,
    ...(completedAt === undefined ? {} : { completedAt }),
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DocumensoConnection", () => {
  it("is a connection of the documenso integration with a secret key", () => {
    expect(kindOf(DocumensoIntegration)?.kind).toBe("integration");
    expect(kindOf(DocumensoConnection)?.kind).toBe("connection");
    expect(Secret.members(DocumensoConnection).get("apiKey")).toBe("DOCUMENSO_API_KEY");
  });

  it("checks the key by listing one document", async () => {
    const connection = connectionOf((fake) =>
      fake.get("/documents").returns((_, { query }) => {
        expect(query).toEqual({ page: 1, perPage: 1 });
        return { documents: [] };
      }),
    );
    await expect(connection.check()).resolves.toMatchObject({ id: "sign.acme.example" });
  });

  it("creates, uploads and sends a new envelope", async () => {
    const created: unknown[] = [];
    const sent: string[] = [];
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const connection = connectionOf((fake) =>
      fake
        .get("/documents")
        .returns(() => ({ documents: [{ id: 7, externalId: "other", status: "PENDING" }] }))
        .post("/documents")
        .returns((_, { body }) => {
          created.push(body);
          return { documentId: 42, uploadUrl: "https://storage.example/up" };
        })
        .post("/documents/:id/send")
        .returns(({ id }) => {
          sent.push(id);
          return {};
        }),
    );
    await expect(connection.send(request)).resolves.toEqual({
      id: "42",
      reference: "frm_1",
      status: SignatureStatus.Sent,
    });
    expect(created).toEqual([
      {
        title: "Consent",
        externalId: "frm_1",
        recipients: [
          { name: "A", email: "a@acme.example", role: "SIGNER", signingOrder: 1 },
          { name: "B", email: "b@acme.example", role: "SIGNER", signingOrder: 2 },
        ],
        meta: { language: "ar", signingOrder: "SEQUENTIAL" },
      },
    ]);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://storage.example/up");
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(request.document);
    expect(sent).toEqual(["42"]);
  });

  it("answers the envelope already opened for the reference", async () => {
    const connection = connectionOf((fake) =>
      fake.get("/documents").returns(() => ({
        documents: [{ id: 42, externalId: "frm_1", status: "PENDING", recipients: [] }],
      })),
    );
    await expect(connection.send(request)).resolves.toEqual({
      id: "42",
      reference: "frm_1",
      status: SignatureStatus.Sent,
    });
  });

  it("refuses a signer without email before calling Documenso", async () => {
    const connection = connectionOf(() => undefined);
    await expect(
      connection.send({ ...request, signers: [{ name: "C", phone: "+10000000000", order: 3 }] }),
    ).rejects.toThrow(SignatureSignerUnreachableError);
  });

  it("fails as unavailable when the upload is refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 403 })),
    );
    const connection = connectionOf((fake) =>
      fake
        .get("/documents")
        .returns(() => ({ documents: [] }))
        .post("/documents")
        .returns(() => ({ documentId: 42, uploadUrl: "https://storage.example/up" })),
    );
    await expect(connection.send(request)).rejects.toThrow(ProviderUnavailableError);
  });

  it.each([
    ["PENDING", [{ readStatus: "NOT_OPENED", signingStatus: "NOT_SIGNED" }], SignatureStatus.Sent],
    ["PENDING", [{ readStatus: "OPENED", signingStatus: "NOT_SIGNED" }], SignatureStatus.Viewed],
    ["PENDING", [{ readStatus: "OPENED", signingStatus: "REJECTED" }], SignatureStatus.Declined],
    ["REJECTED", [], SignatureStatus.Declined],
    ["COMPLETED", [], SignatureStatus.Signed],
  ])("maps %s with %j to %s", async (state, recipients, expected) => {
    const connection = connectionOf((fake) =>
      fake.get("/documents/:id").returns(document(state, recipients)),
    );
    expect((await connection.status("42")).status).toBe(expected);
  });

  it("names a signed envelope's close time", async () => {
    const connection = connectionOf((fake) =>
      fake.get("/documents/:id").returns(document("COMPLETED", [], "2026-10-27T10:00:00.000Z")),
    );
    await expect(connection.status("42")).resolves.toEqual({
      id: "42",
      reference: "frm_1",
      status: SignatureStatus.Signed,
      closedAt: "2026-10-27T10:00:00.000Z",
    });
  });

  it("turns Documenso's 404 into not found", async () => {
    const connection = connectionOf((fake) =>
      fake.get("/documents/:id").returns(() => {
        throw ProviderRefusedError.create({ provider: "documenso", status: 404 });
      }),
    );
    await expect(connection.status("9")).rejects.toThrow(SignatureEnvelopeNotFoundError);
  });

  it("downloads the signed PDF only once signed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array([1, 2]))),
    );
    const pending = connectionOf((fake) => fake.get("/documents/:id").returns(document("PENDING")));
    await expect(pending.download("42")).rejects.toThrow(SignatureNotCompleteError);
    const signed = connectionOf((fake) =>
      fake
        .get("/documents/:id")
        .returns(document("COMPLETED"))
        .get("/documents/:id/download")
        .returns(() => ({ downloadUrl: "https://storage.example/down" })),
    );
    await expect(signed.download("42")).resolves.toEqual(new Uint8Array([1, 2]));
  });

  it("cancels an open envelope and refuses a final one", async () => {
    const deleted: string[] = [];
    const open = connectionOf((fake) =>
      fake
        .get("/documents/:id")
        .returns(document("PENDING"))
        .delete("/documents/:id")
        .returns(({ id }) => {
          deleted.push(id);
          return {};
        }),
    );
    const cancelled = await open.cancel("42");
    expect(cancelled.status).toBe(SignatureStatus.Cancelled);
    expect(cancelled.closedAt).toBeDefined();
    expect(deleted).toEqual(["42"]);
    const signed = connectionOf((fake) =>
      fake.get("/documents/:id").returns(document("COMPLETED")),
    );
    await expect(signed.cancel("42")).rejects.toThrow(SignatureEnvelopeClosedError);
  });
});
