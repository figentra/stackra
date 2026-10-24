/**
 * Stackra file contract:
 * Purpose: `TransportFailure`, why a call ended in a `TransportError` instead of an answer or a refusal: the network
 *          failed, the call timed out, or the producer answered something the client cannot read.
 * Boundary: an `Enum.of` value plus the type of the same name; the `reason` detail of a `TransportError`. A refusal the
 *           producer sent is never a transport failure.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/**
 * The reasons of a transport error.
 *
 * @example
 * if (isRefusal(error, TransportError) && error.reason === TransportFailure.Network) showOfflineBanner();
 */
export const TransportFailure = Enum.of({
  /** The request never got an answer: offline, DNS, a dropped connection. */
  Network: "network",
  /** No answer within the transport's timeout. */
  Timeout: "timeout",
  /** An answer without a refusal envelope (a proxy's 502), or a body the output schema refuses. */
  Response: "response",
});

/** One of the codes above. */
export type TransportFailure = Enum.Value<typeof TransportFailure>;
