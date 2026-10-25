/**
 * Stackra file contract:
 * Purpose: `readServerSentEvents`, the reader of a `text/event-stream` body: yields each event as it is dispatched,
 *          for streamed AI output and live progress over plain fetch (so headers such as `Authorization` and
 *          `Stackra-Version` go with it, which `EventSource` cannot send).
 * Boundary: follows the WHATWG interpretation rules: `:` lines are comments, a field without a colon has an empty
 *           value, one space after the colon is dropped, `data:` lines join with `\n`, an event with no data is not
 *           dispatched, the last event id and the reconnection time persist across events, an `id` holding NUL and a
 *           non-numeric `retry` are ignored, and an event left unterminated at the end is dropped. Reconnecting is the
 *           caller's (it sends `Last-Event-ID` from `id`). Stopping early cancels the body.
 * Runtime: isomorphic
 * Governing contract: the WHATWG HTML event-stream interpretation rules; ADR 0260.
 */
import { readLines } from "#core/functions/read-lines.function";
import type { ServerSentEvent } from "#core/types/server-sent-event.type";

/**
 * The events of `response`'s body.
 *
 * @yields Each dispatched event.
 * @example
 * for await (const { event, data } of readServerSentEvents(await send(request))) {
 *   if (event === "delta") append(data);
 * }
 */
export async function* readServerSentEvents(response: Response): AsyncGenerator<ServerSentEvent> {
  let event = "";
  let data: string[] = [];
  let id = "";
  let retry: number | undefined;
  for await (const line of readLines(response)) {
    if (line === "") {
      if (data.length > 0)
        yield {
          event: event || "message",
          data: data.join("\n"),
          id,
          ...(retry === undefined ? {} : { retry }),
        };
      event = "";
      data = [];
      continue;
    }
    if (line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const raw = colon === -1 ? "" : line.slice(colon + 1);
    const value = raw.startsWith(" ") ? raw.slice(1) : raw;
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
    else if (field === "id" && !value.includes("\0")) id = value;
    else if (field === "retry" && /^\d+$/.test(value)) retry = Number(value);
  }
}
