/**
 * Stackra file contract:
 * Purpose: `ProviderRefusedError` (`provider_refused`), the refusal the managed client throws when a provider answers
 *          a call with a 4xx other than 408 and 429: the call was understood and refused, so it is not retried.
 * Boundary: kind `FailedPrecondition`, never retryable. Its details are the provider, the HTTP status and the
 *           provider's own error code (`restricted_api_key`), never the response body, which may echo a credential.
 *           `create` takes the provider's code as `code` and keeps it as `providerCode`, because `code` is the
 *           refusal's own derived code; `is` matches a refusal by status and provider code.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13); ADR 0140 (envelope and kinds); ADR 0232 (decision 2); R-02 (typed `create`).
 */
import { ErrorKind, isRefusal, Refusal } from "@stackra/errors";
import type { FieldErrors, RefusalDetails } from "@stackra/errors";

/** The details as a caller writes them: the provider's error code as `code`. */
interface ProviderRefusal {
  readonly provider?: string;
  readonly status: number;
  readonly code?: string;
}

/** The provider refused the call; `status` and `providerCode` say why. */
export class ProviderRefusedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The provider's code (`resend`), when the managed client raised it. */
  provider?: string;

  /** The provider's HTTP status (`401`). */
  status!: number;

  /** The provider's own error code (`restricted_api_key`), when its answer named one. */
  providerCode?: string;

  /**
   * A refusal with the provider's status and its error code.
   *
   * @example
   * throw ProviderRefusedError.create({ status: 401, code: "restricted_api_key" });
   */
  static override create<T extends Refusal>(
    this: new () => T,
    ...[details, extras]: [
      details?: RefusalDetails<T> | ProviderRefusal,
      extras?: { readonly fieldErrors?: FieldErrors; readonly cause?: unknown },
    ]
  ): T {
    const { code, ...rest } = (details ?? {}) as ProviderRefusal;
    const create = super.create as unknown as (this: unknown, values: object, more?: object) => T;
    return create.call(this, code === undefined ? rest : { ...rest, providerCode: code }, extras);
  }

  /**
   * Whether `value` is a `ProviderRefusedError` with the given status and provider code.
   *
   * @example
   * if (!ProviderRefusedError.is(error, { status: 401, code: "restricted_api_key" })) throw error;
   */
  static is(
    value: unknown,
    match: { readonly status?: number; readonly code?: string } = {},
  ): value is ProviderRefusedError {
    return (
      isRefusal(value, ProviderRefusedError) &&
      (match.status === undefined || value.status === match.status) &&
      (match.code === undefined || value.providerCode === match.code)
    );
  }
}
