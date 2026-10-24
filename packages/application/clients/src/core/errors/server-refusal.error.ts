/**
 * Stackra file contract:
 * Purpose: `ServerRefusalError`, a refusal the producer sent whose code no loaded refusal ref declares: it carries the
 *          envelope's code, kind (from its category), `retryable`, details and field errors.
 * Boundary: `isRefusal(error, SomeError)` still matches by code, so code written against a ref that was not loaded keeps
 *           working. Its message is the code, as every refusal's; it has no translated message key.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";
import type { ErrorEnvelope } from "@stackra/errors";

import { DECODED_ENVELOPE } from "#core/constants/decoded-envelope.constant";
import { installDecodedAccessors } from "#core/functions/install-decoded-accessors.function";

/**
 * A refusal with a code this client does not know.
 *
 * @example
 * if (error instanceof ServerRefusalError) report(error.code); // a code no loaded ref declares
 */
export class ServerRefusalError extends Refusal({ kind: ErrorKind.Internal }) {}

installDecodedAccessors(ServerRefusalError.prototype, { kind: ErrorKind.Internal });

// The code is the envelope's; TypeScript refuses an accessor over the `Refusal` interface's `code` in a class body.
Object.defineProperty(ServerRefusalError.prototype, "code", {
  get(this: { readonly [DECODED_ENVELOPE]?: ErrorEnvelope }): string {
    return this[DECODED_ENVELOPE]?.code ?? "server_refusal";
  },
});
