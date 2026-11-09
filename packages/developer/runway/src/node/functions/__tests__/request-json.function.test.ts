/**
 * Stackra file contract:
 * Purpose: unit tests of `requestJson`: the request goes out with JSON headers (the caller's win) and a JSON body only
 *          when one is given; the answer is parsed (empty is `{}`, an array is `{ items }`, non-JSON is `{}`); an
 *          accepted non-2xx status is answered; any other status throws naming the step, the status and the API's own
 *          message, never the token or the body.
 * Boundary: test only; `fetch` is a fake that records its calls.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0482 (decisions 4 and 7), ADR 0173.
 */
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RunwayUnresolvedError } from "#core/errors/runway-unresolved.error";
import { requestJson } from "#node/functions/request-json.function";

const TOKEN = "Bearer canary-token";

/** A fake `fetch` that answers `body` (a string as is, else JSON) with `status`. */
function answering(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return vi.fn<typeof fetch>(async () => new Response(text, { status }));
}

describe("requestJson", () => {
  it("sends JSON with the caller's headers and parses the answer", async () => {
    const fetcher = answering(201, { id: "p-1" });

    const answer = await requestJson(fetcher, {
      what: "create project",
      method: "POST",
      url: "https://api.example/projects",
      headers: { authorization: TOKEN, accept: "application/vnd.api+json" },
      body: { name: "acme" },
    });

    expect(answer).toEqual({ status: 201, body: { id: "p-1" } });
    expect(fetcher).toHaveBeenCalledWith("https://api.example/projects", {
      method: "POST",
      headers: {
        accept: "application/vnd.api+json",
        "content-type": "application/json",
        authorization: TOKEN,
      },
      body: '{"name":"acme"}',
    });
  });

  it("sends no body without one, and reads empty, array and non-JSON answers", async () => {
    const request = { what: "list", method: "GET", url: "https://api.example/x", headers: {} };
    const empty = answering(200, "");

    expect(await requestJson(empty, request)).toEqual({ status: 200, body: {} });
    expect(empty.mock.calls[0]?.[1]).toEqual({
      method: "GET",
      headers: { accept: "application/json" },
    });
    expect((await requestJson(answering(200, [1, 2]), request)).body).toEqual({ items: [1, 2] });
    expect((await requestJson(answering(200, "<html>"), request)).body).toEqual({});
  });

  it("answers an accepted status instead of throwing", async () => {
    const answer = await requestJson(answering(404, { error: { message: "Not found" } }), {
      what: "find project",
      method: "GET",
      url: "https://api.example/projects/acme",
      headers: { authorization: TOKEN },
      accept: [404],
    });

    expect(answer).toEqual({ status: 404, body: { error: { message: "Not found" } } });
  });

  it("throws naming the step, status and API message, never the token or body", async () => {
    const request = {
      what: "set secret",
      method: "POST",
      url: "https://api.example/secrets",
      headers: { authorization: TOKEN },
      body: { value: "canary-secret" },
    };

    await expect(
      requestJson(answering(403, { error: { message: "Forbidden" } }), request),
    ).rejects.toThrow(new RunwayUnresolvedError("set secret: HTTP 403 (Forbidden)"));
    await expect(
      requestJson(answering(400, { errors: [{ detail: "Bad name" }] }), request),
    ).rejects.toThrow("set secret: HTTP 400 (Bad name)");
    await expect(requestJson(answering(500, { message: "Boom" }), request)).rejects.toThrow(
      "set secret: HTTP 500 (Boom)",
    );
    await expect(requestJson(answering(502, "bad gateway"), request)).rejects.toThrow(
      /^set secret: HTTP 502$/,
    );
  });
});
