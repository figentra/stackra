/**
 * Stackra file contract:
 * Purpose: `clientRequest`, builds the `ClientRequest` a transport receives from a ref, the caller's input and the call
 *          options: the input is validated by the ref's input schema and turned into its wire form (JSON, dates as
 *          ISO text).
 * Boundary: internal to the client runtime; not exported from an entry. An invalid input is refused here, before any
 *           transport runs, as `InputInvalidError` with one field error per refused path.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (decision 3); ADR 0140 (field errors); ADR 0138 (Idempotency-Key).
 */
import { InputInvalidError } from "@stackra/actions";
import type { Json } from "@stackra/contracts";
import type { FieldErrors } from "@stackra/errors";
import type { ZodError } from "zod";

import type { ClientRequest } from "#contracts/types/client-request.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { CallRef } from "#core/types/call-ref.type";

/** One message per refused input path (`lines.0.quantity`), the first issue of a path winning. */
function fieldErrorsOf(error: ZodError): FieldErrors {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[issue.path.map(String).join(".")] ??= issue.message;
  return errors;
}

/**
 * The request for calling `ref` with `input`.
 *
 * @throws InputInvalidError when `input` does not match the ref's input schema.
 * @example
 * await transport.send(clientRequest(GetOrderQuery, { orderId }, { signal }));
 */
export function clientRequest(
  ref: CallRef,
  input: unknown,
  options: CallOptions = {},
): ClientRequest {
  const parsed = ref.input.safeParse(input);
  if (!parsed.success)
    throw InputInvalidError.create({}, { fieldErrors: fieldErrorsOf(parsed.error) });
  // JSON is the wire: a `Date` becomes its ISO text and nothing that cannot travel survives.
  const wire = JSON.parse(JSON.stringify(parsed.data ?? null)) as Json;
  return {
    key: ref.key,
    kind: ref.kind,
    ...(ref.endpoint === undefined ? {} : { endpoint: ref.endpoint }),
    input: wire,
    output: ref.output,
    ...(options.idempotencyKey === undefined ? {} : { idempotencyKey: options.idempotencyKey }),
    ...(options.onBehalfOf === undefined ? {} : { onBehalfOf: options.onBehalfOf }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  };
}
