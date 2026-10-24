/**
 * Stackra file contract:
 * Purpose: `FakeAnswer<P>`, what a fake route answers with: a function of the path's parameters and the request that
 *          returns the provider's answer, or throws the refusal the managed client would.
 * Boundary: a type only. The answer is returned as the provider's parsed JSON; a thrown error rejects the call.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { PathParams } from "#testing/types/path-params.type";

/**
 * A fake route's answer.
 *
 * @example
 * const answer: FakeAnswer<"/emails/receiving/:id"> = ({ id }) => ({ id, from: "customer@acme.example" });
 */
export type FakeAnswer<P extends string> = (
  params: PathParams<P>,
  request: {
    /** The JSON body sent, or undefined. */
    readonly body: unknown;
    /** The query parameters sent. */
    readonly query: Readonly<Record<string, string | number | boolean>>;
    /** The extra headers sent. */
    readonly headers: Readonly<Record<string, string>>;
  },
) => unknown;
