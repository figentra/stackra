/**
 * Stackra file contract:
 * Purpose: `readNdjson`, the reader of a newline-delimited JSON body (`application/x-ndjson`): yields each line's
 *          value as it arrives, for streamed query results and progress.
 * Boundary: yields `unknown`: the body comes from outside, so the caller parses each value with its schema. Blank
 *           lines are skipped; a line that is not JSON throws `SyntaxError` and cancels the body. Stopping early
 *           cancels the body too.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (clients call through the transport); NDJSON.
 */
import { readLines } from "#core/functions/read-lines.function";

/**
 * The JSON values of `response`'s body, one per line.
 *
 * @yields Each non-blank line's parsed value, unchecked.
 * @throws SyntaxError when a line is not JSON.
 * @example
 * for await (const value of readNdjson(await send(request))) rows.push(OrderRow.parse(value));
 */
export async function* readNdjson(response: Response): AsyncGenerator<unknown> {
  for await (const line of readLines(response)) if (line.trim() !== "") yield JSON.parse(line);
}
