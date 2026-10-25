/**
 * Stackra file contract:
 * Purpose: unit tests of `httpCall`: the HTTP request built from a `ClientRequest` (route params, query string, JSON
 *          body, headers, Idempotency-Key, device order, queued call), the decoded answer, the decoded refusal, and each transport
 *          failure (network, timeout, an answer without an envelope, a body the output schema refuses).
 * Boundary: test only; the transport is a function standing in for `fetch`, so nothing reaches a network.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0140 (envelope); ADR 0142; ADR 0138; the HTTP conventions rule.
 */
import { Duration, HttpMethod } from "@stackra/contracts";
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { RequestTimedOutError } from "@stackra/transport";
import type { Transport } from "@stackra/transport";
import { z } from "zod";

import { TransportFailure } from "#contracts/enums/transport-failure.enum";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { TransportError } from "#core/errors/transport.error";
import { httpCall } from "#core/functions/http-call.function";
import { refusalRef } from "#core/functions/refusal-ref.function";

class VariantNotFoundError extends refusalRef("catalogue.variant_not_found") {}

const API = "https://api.acme.example";

const output = z.object({ variantId: z.string(), title: z.string() });

/** A transport that records the request and answers with `response`. */
function answering(response: () => Response): { transport: Transport; sent: Request[] } {
  const sent: Request[] = [];
  return {
    sent,
    transport: (request) => {
      sent.push(request);
      return Promise.resolve(response());
    },
  };
}

/** What `call` rejected with. */
async function rejection(call: Promise<unknown>): Promise<unknown> {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error("expected the call to reject");
}

const lookup: ClientRequest = {
  key: "catalogue.variant.get_by_barcode@1",
  kind: "query",
  endpoint: { method: HttpMethod.Get, path: "/variants/by-barcode/:barcode" },
  input: { barcode: "6281000000001", filter: { status: ["active"] }, limit: 10 },
  output,
};

describe("httpCall", () => {
  it("fills the route, puts the rest in the query string and decodes the answer", async () => {
    const { transport, sent } = answering(() =>
      Response.json({ variantId: "var_1", title: "Tee", extra: true }),
    );
    const answer = await httpCall(lookup, {
      baseUrl: "https://api.acme.example/",
      transport,
      headers: { Authorization: "Bearer t" },
    });
    expect(answer).toEqual({ variantId: "var_1", title: "Tee" });
    const url = new URL(sent[0]?.url ?? "");
    expect(url.pathname).toBe("/variants/by-barcode/6281000000001");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("filter")).toBe('{"status":["active"]}');
    expect(sent[0]?.method).toBe("GET");
    expect(sent[0]?.headers.get("Authorization")).toBe("Bearer t");
  });

  it("sends a write's remaining input as JSON with the caller's Idempotency-Key", async () => {
    const { transport, sent } = answering(() =>
      Response.json({ variantId: "var_1", title: "Tee" }),
    );
    await httpCall(
      {
        key: "catalogue.variant.rename@1",
        kind: "action",
        endpoint: { method: HttpMethod.Put, path: "/variants/:variantId/rename" },
        input: { variantId: "var_1", title: "Tee" },
        output,
        idempotencyKey: "step-7",
      },
      { baseUrl: "https://api.acme.example", transport, headers: {} },
    );
    expect(sent[0]?.url).toBe("https://api.acme.example/variants/var_1/rename");
    expect(sent[0]?.headers.get("Idempotency-Key")).toBe("step-7");
    expect(sent[0]?.headers.get("Content-Type")).toBe("application/json");
    expect(await sent[0]?.json()).toEqual({ title: "Tee" });
  });

  it("sends the call's device and its sequence as the DEVICE_ORDER headers", async () => {
    const { transport, sent } = answering(() =>
      Response.json({ variantId: "var_1", title: "Tee" }),
    );
    const rename: ClientRequest = {
      key: "catalogue.variant.rename@1",
      kind: "action",
      endpoint: { method: HttpMethod.Put, path: "/variants/:variantId/rename" },
      input: { variantId: "var_1", title: "Tee" },
      output,
    };
    await httpCall(
      { ...rename, device: { deviceId: "device-1", sequence: 1729760400000 } },
      { baseUrl: API, transport, headers: {} },
    );
    expect(sent[0]?.headers.get("Stackra-Device")).toBe("device-1");
    expect(sent[0]?.headers.get("Stackra-Device-Sequence")).toBe("1729760400000");
    await httpCall(
      { ...rename, device: { deviceId: "device-1" } },
      { baseUrl: API, transport, headers: {} },
    );
    expect(sent[1]?.headers.get("Stackra-Device")).toBe("device-1");
    expect(sent[1]?.headers.has("Stackra-Device-Sequence")).toBe(false);
    await httpCall(rename, { baseUrl: API, transport, headers: {} });
    expect(sent[2]?.headers.has("Stackra-Device")).toBe(false);
  });

  it("asks a queued call to run asynchronously and reads no answer", async () => {
    const { transport, sent } = answering(() => new Response(null, { status: 202 }));
    const answer = await httpCall(
      {
        key: "messages.message.send@1",
        kind: "action",
        endpoint: { method: HttpMethod.Post, path: "/messages" },
        input: { mail: "receipt" },
        output: z.object({ messageId: z.string() }),
      },
      { baseUrl: "https://api.acme.example", transport, headers: {}, queue: true },
    );
    expect(answer).toBeUndefined();
    expect(sent[0]?.headers.get("Prefer")).toBe("respond-async");
  });

  it("rejects with the producer's refusal decoded from its envelope", async () => {
    const { transport } = answering(() =>
      Response.json(
        { code: "variant_not_found", category: "not_found", retryable: false },
        { status: 404 },
      ),
    );
    const error = await rejection(httpCall(lookup, { baseUrl: API, transport, headers: {} }));
    expect(isRefusal(error, VariantNotFoundError)).toBe(true);
    expect((error as VariantNotFoundError).kind).toBe(ErrorKind.NotFound);
  });

  it("rejects with a transport error for an answer without an envelope", async () => {
    const { transport } = answering(() => new Response("Bad gateway", { status: 502 }));
    const error = await rejection(httpCall(lookup, { baseUrl: API, transport, headers: {} }));
    expect(isRefusal(error, TransportError)).toBe(true);
    expect(error).toMatchObject({ reason: TransportFailure.Response, status: 502 });
  });

  it("rejects with a transport error for a body the output schema refuses", async () => {
    const { transport } = answering(() => Response.json({ variantId: 1 }));
    const error = await rejection(httpCall(lookup, { baseUrl: API, transport, headers: {} }));
    expect(error).toMatchObject({ reason: TransportFailure.Response, status: 200 });
  });

  it("rejects with a network or timeout transport error when no answer came", async () => {
    const offline = await rejection(
      httpCall(lookup, {
        baseUrl: API,
        transport: () => Promise.reject(new TypeError("fetch failed")),
        headers: {},
      }),
    );
    expect(offline).toMatchObject({ reason: TransportFailure.Network });
    const slow = await rejection(
      httpCall(lookup, {
        baseUrl: API,
        transport: () =>
          Promise.reject(RequestTimedOutError.create({ timeout: Duration.seconds(30) })),
        headers: {},
      }),
    );
    expect(slow).toMatchObject({ reason: TransportFailure.Timeout });
  });

  it("refuses a call without a route, with a missing route param, or on behalf of a principal", async () => {
    const options = {
      baseUrl: API,
      transport: answering(() => Response.json({})).transport,
      headers: {},
    };
    const unrouted: ClientRequest = { key: lookup.key, kind: "query", input: {}, output };
    await expect(httpCall(unrouted, options)).rejects.toThrow(TypeError);
    await expect(httpCall({ ...lookup, input: {} }, options)).rejects.toThrow(TypeError);
    await expect(httpCall({ ...lookup, onBehalfOf: "usr_1" }, options)).rejects.toThrow(TypeError);
  });
});
