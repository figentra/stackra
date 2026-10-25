/**
 * Stackra file contract:
 * Purpose: unit tests of `readServerSentEvents` against the WHATWG interpretation rules: default and named events,
 *          multi-line data, comments, one leading space dropped, a field without a colon, events without data not
 *          dispatched, the last event id and reconnection time persisting, a NUL id and a non-numeric retry ignored,
 *          and an unterminated event dropped.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; the WHATWG event-stream rules.
 */
import { describe, expect, it } from "@stackra/testing";

import { readServerSentEvents } from "#core/functions/read-server-sent-events.function";
import type { ServerSentEvent } from "#core/types/server-sent-event.type";

/** Every event of a `text/event-stream` body. */
async function events(body: string): Promise<ServerSentEvent[]> {
  const all: ServerSentEvent[] = [];
  for await (const event of readServerSentEvents(new Response(body))) all.push(event);
  return all;
}

describe("readServerSentEvents", () => {
  it("yields a message event with data", async () => {
    expect(await events("data: hello\n\n")).toEqual([{ event: "message", data: "hello", id: "" }]);
  });

  it("names the event and joins data lines with a line feed", async () => {
    expect(await events("event: delta\r\ndata: one\r\ndata: two\r\n\r\n")).toEqual([
      { event: "delta", data: "one\ntwo", id: "" },
    ]);
  });

  it("skips comments and drops only one leading space", async () => {
    expect(await events(": keep-alive\ndata:  indented\ndata:tight\n\n")).toEqual([
      { event: "message", data: " indented\ntight", id: "" },
    ]);
  });

  it("reads a field without a colon as an empty value", async () => {
    expect(await events("data\n\n")).toEqual([{ event: "message", data: "", id: "" }]);
  });

  it("does not dispatch an event without data, and resets the name after each block", async () => {
    expect(await events("event: ping\n\ndata: after\n\n")).toEqual([
      { event: "message", data: "after", id: "" },
    ]);
  });

  it("keeps the last event id and the reconnection time across events", async () => {
    expect(await events("id: 7\nretry: 3000\ndata: a\n\ndata: b\n\nid\ndata: c\n\n")).toEqual([
      { event: "message", data: "a", id: "7", retry: 3000 },
      { event: "message", data: "b", id: "7", retry: 3000 },
      { event: "message", data: "c", id: "", retry: 3000 },
    ]);
  });

  it("ignores an id holding NUL and a retry that is not a number", async () => {
    expect(await events("id: 1\n\nid: a\0b\nretry: soon\ndata: x\n\n")).toEqual([
      { event: "message", data: "x", id: "1" },
    ]);
  });

  it("drops an event left unterminated at the end", async () => {
    expect(await events("data: done\n\ndata: cut")).toEqual([
      { event: "message", data: "done", id: "" },
    ]);
  });
});
