/**
 * Stackra file contract:
 * Purpose: `webBodyOf(source)`, a Fetch `ReadableStream` of the bytes a Node readable (an Encore raw request) delivers,
 *          which the generated adapter hands to `new Request(..., { body })` for every method but `GET` and `HEAD`.
 * Boundary: reads the stream with its `data`, `end`, `error` and `close` events only, applies back-pressure with
 *           `pause` and `resume`, and destroys the source if the reader cancels. It never calls `Readable.toWeb`: that
 *           inspects `stream.req` when the stream closes, and Encore's raw request carries a `req` that is not an event
 *           emitter, so `toWeb` raised "stream.req.removeListener is not a function" as an uncaught exception that ended
 *           the process on the first write request.
 * Runtime: node
 * Governing contract: ADR 0237 (STA-2577 note: every generated adapter is raw, so the edge signature covers the body);
 *                     ADR 0295 (decision 8: the adapters reach the member through `handlers`).
 */
import type { Readable } from "node:stream";

/** What `webBodyOf` reads: the part of a Node readable it uses. */
type Source = Pick<Readable, "on" | "pause" | "resume"> & {
  readonly destroy?: Readable["destroy"];
};

const ENCODER = new TextEncoder();

/**
 * The body of `source` as a Fetch stream.
 *
 * @param source - a Node readable (an incoming request).
 * @example
 * new Request("http://x/notes", { method: "POST", body: webBodyOf(req), duplex: "half" } as RequestInit);
 */
export function webBodyOf(source: Source): ReadableStream<Uint8Array> {
  let finished = false;
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const finish = (error?: Error): void => {
        if (finished) return;
        finished = true;
        if (error === undefined) controller.close();
        else controller.error(error);
      };
      source.on("data", (chunk: Uint8Array | string) => {
        if (finished) return;
        controller.enqueue(
          typeof chunk === "string" ? ENCODER.encode(chunk) : new Uint8Array(chunk),
        );
        if (controller.desiredSize !== null && controller.desiredSize <= 0) source.pause();
      });
      source.on("end", () => {
        finish();
      });
      source.on("error", (error: Error) => {
        finish(error);
      });
      // closed before it ended: the caller went away mid-body
      source.on("close", () => {
        finish(new Error("the request body was cut short"));
      });
    },
    pull() {
      source.resume();
    },
    cancel() {
      finished = true;
      source.destroy?.();
    },
  });
}
