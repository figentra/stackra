/**
 * Stackra file contract:
 * Purpose: `textDom`, a stand-in of the native `Text`: a `span`, with no provider needed.
 * Boundary: test-only; used as `vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom)`.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0305 (one declaration per file); STA-1371.
 */
import { domOf } from "#testing/fakes/dom-of.function";

/** The `#native/text/text` stand-in: a `span`, with no provider needed. */
export const textDom = { Text: domOf("span") };
