/**
 * Stackra file contract:
 * Purpose: `decodeText`, the text chunks of a byte source: detects the encoding on the first non-empty chunk unless one
 *          is given, then decodes strictly, carrying a character split across chunks.
 * Boundary: internal to the CSV reader. Strict: a byte sequence the encoding cannot read is a refusal, never a
 *           replacement character. The decoder drops a leading byte order mark.
 * Runtime: isomorphic
 * Governing contract: ADR 0367 (decision 3).
 */
import type { TabularSource } from "#contracts/types/tabular-source.type";
import { UnreadableEncodingError } from "#core/errors/unreadable-encoding.error";
import { detectEncoding } from "#core/functions/detect-encoding.function";

/**
 * The decoded text of `source`.
 *
 * @yields Decoded text chunks, in order.
 * @throws UnreadableEncodingError when the encoding cannot be detected or a byte sequence does not decode.
 * @throws RangeError when `encoding` or `fallback` is not an encoding label the runtime knows.
 */
export async function* decodeText(
  source: TabularSource,
  encoding: string | undefined,
  fallback: string | undefined,
): AsyncGenerator<string> {
  let decoder: TextDecoder | undefined;
  try {
    for await (const chunk of source) {
      if (chunk.length === 0) continue;
      decoder ??= new TextDecoder(encoding ?? detectEncoding(chunk, fallback), { fatal: true });
      const text = decoder.decode(chunk, { stream: true });
      if (text !== "") yield text;
    }
    const rest = decoder?.decode() ?? "";
    if (rest !== "") yield rest;
  } catch (error) {
    // a fatal TextDecoder throws TypeError on bytes its encoding cannot read
    if (error instanceof TypeError)
      throw UnreadableEncodingError.create(
        decoder === undefined ? {} : { encoding: decoder.encoding },
      );
    throw error;
  }
}
