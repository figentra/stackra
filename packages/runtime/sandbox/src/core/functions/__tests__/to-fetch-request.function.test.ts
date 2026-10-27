/**
 * Stackra file contract:
 * Purpose: unit tests of `toFetchRequest`: an allowed request is normalised (method upper-cased, GET and
 *          no headers by default, the body kept), and every malformed argument or origin outside the allow-list is a
 *          `TypeError` with the message the guest sees.
 * Boundary: test only; plain values, no engine.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0154 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { toFetchRequest } from "#core/functions/to-fetch-request.function";

const ORIGINS = new Set(["https://api.example.com"]);

describe(toFetchRequest, () => {
  it("normalises an allowed request", () => {
    expect(toFetchRequest("https://api.example.com/a", undefined, ORIGINS)).toEqual({
      url: "https://api.example.com/a",
      method: "GET",
      headers: {},
    });
    expect(
      toFetchRequest(
        "https://api.example.com/a",
        { method: "post", headers: { accept: "x" }, body: "{}" },
        ORIGINS,
      ),
    ).toEqual({
      url: "https://api.example.com/a",
      method: "POST",
      headers: { accept: "x" },
      body: "{}",
    });
  });

  it("refuses malformed arguments and origins outside the allow-list", () => {
    expect(() => toFetchRequest(1, undefined, ORIGINS)).toThrow("fetch: the URL is a string");
    expect(() => toFetchRequest("nope", undefined, ORIGINS)).toThrow(
      "fetch: nope is not an allowed origin",
    );
    expect(() => toFetchRequest("https://evil.example.org/x", undefined, ORIGINS)).toThrow(
      "fetch: https://evil.example.org is not an allowed origin",
    );
    const url = "https://api.example.com/a";
    expect(() => toFetchRequest(url, 5, ORIGINS)).toThrow("fetch: the options are an object");
    expect(() => toFetchRequest(url, { method: 1 }, ORIGINS)).toThrow("the method is a string");
    expect(() => toFetchRequest(url, { headers: { a: 1 } }, ORIGINS)).toThrow(
      "the headers are an object of strings",
    );
    expect(() => toFetchRequest(url, { body: 1 }, ORIGINS)).toThrow("the body is a string");
  });
});
