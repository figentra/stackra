/**
 * Stackra file contract:
 * Purpose: unit tests of `webBodyOf`: the bytes of a Node readable arrive as a Fetch stream, in order, text and binary;
 *          an empty body is an empty stream; an error or an early close errors the stream; a reader's cancel destroys
 *          the source; back-pressure pauses the source; and a source whose `req` property is not an event emitter (an
 *          Encore raw request) neither throws nor ends the process, which `Readable.toWeb` does.
 * Boundary: test only; real `node:stream` readables, no network. The Encore case is the reproduction of the crash that
 *           `webBodyOf` replaces, kept beside its fix.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0237 (generated adapters are raw).
 */
import { PassThrough, Readable } from "node:stream";

import { describe, expect, it } from "@stackra/testing";

import { webBodyOf } from "#server/functions/web-body-of.function";

/** Everything `body` delivers, as one byte array. */
async function drain(body: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  const reader = body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
  }
  return Uint8Array.from(parts.flatMap((part) => [...part]));
}

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/** One turn of the event loop, or `ms` milliseconds. */
const tick = (ms = 0): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/** A readable that delivers `chunks` then ends. */
const readableOf = (...chunks: (string | Uint8Array)[]): Readable =>
  Readable.from(chunks, { objectMode: false });

describe(webBodyOf, () => {
  /** The common case: a JSON body in two chunks. */
  it("delivers a body's bytes in order", async () => {
    expect(text(await drain(webBodyOf(readableOf('{"a":', "1}"))))).toBe('{"a":1}');
  });

  /** Binary bytes are not re-encoded as text. */
  it("delivers binary bytes unchanged", async () => {
    const bytes = Uint8Array.from([0, 255, 128, 7]);
    expect([...(await drain(webBodyOf(Readable.from([Buffer.from(bytes)]))))]).toEqual([
      0, 255, 128, 7,
    ]);
  });

  /** A write with no body (a bare POST) is an empty stream, not a hang. */
  it("delivers an empty body as an empty stream", async () => {
    expect((await drain(webBodyOf(readableOf()))).length).toBe(0);
  });

  /** A source error reaches the reader. */
  it("errors the stream when the source errors", async () => {
    const source = new PassThrough();
    const body = webBodyOf(source);
    source.destroy(new Error("socket reset"));
    await expect(drain(body)).rejects.toThrow("socket reset");
  });

  /** A body cut short is an error, not a silently short body. */
  it("errors the stream when the source closes before it ends", async () => {
    const source = new PassThrough();
    const body = webBodyOf(source);
    source.write("half");
    source.destroy();
    await expect(drain(body)).rejects.toThrow(/cut short|premature|aborted/i);
  });

  /** The reader going away destroys the source. */
  it("destroys the source when the reader cancels", async () => {
    const source = new PassThrough();
    const reader = webBodyOf(source).getReader();
    source.write("some");
    await reader.read();
    await reader.cancel();
    expect(source.destroyed).toBe(true);
  });

  /** A body larger than the stream's queue pauses the source until the reader pulls. */
  it("pauses the source under back-pressure and resumes it as the reader pulls", async () => {
    const source = new PassThrough();
    const reader = webBodyOf(source).getReader();
    source.write(new Uint8Array(4));
    await tick();
    expect(source.isPaused()).toBe(true);
    await reader.read();
    await tick();
    expect(source.isPaused()).toBe(false);
    source.end();
    expect((await reader.read()).done).toBe(true);
  });

  /**
   * Encore's raw request has a `req` property that is not an event emitter. `Readable.toWeb` reads it when the stream
   * closes and raises an uncaught TypeError, which ends the process; `webBodyOf` never looks at it.
   */
  it("survives a source whose req property is not an emitter (the Encore raw request)", async () => {
    const source = readableOf("payload") as Readable & { req?: object };
    source.req = {};
    const uncaught: Error[] = [];
    const record = (error: Error): void => {
      uncaught.push(error);
    };
    process.on("uncaughtException", record);
    try {
      expect(text(await drain(webBodyOf(source)))).toBe("payload");
      await tick(50);
      expect(uncaught).toEqual([]);
    } finally {
      process.off("uncaughtException", record);
    }
  });
});
