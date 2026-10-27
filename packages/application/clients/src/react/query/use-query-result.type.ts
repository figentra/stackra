/**
 * Stackra file contract:
 * Purpose: `UseQueryResult<T>`, what `useQuery` returns: the decoded answer, the error, the loading flags and `refetch`.
 * Boundary: a type only; `error` is always a `ClientError` (a refusal or a transport error), never a raw response.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (TanStack Query core); ADR 0140 (refusals).
 */
import type { ClientError } from "#core/types/client-error.type";

/** The state of one query on screen. */
export interface UseQueryResult<T> {
  /** The decoded answer, once one arrived. */
  readonly data: T | undefined;

  /** The error of the last fetch; `null` otherwise. */
  readonly error: ClientError | null;

  /** True until a first answer or error exists. */
  readonly isPending: boolean;

  /** True while the first fetch runs with nothing cached. */
  readonly isLoading: boolean;

  /** True while any fetch runs, a background refetch included. */
  readonly isFetching: boolean;

  /** Fetches again now. */
  readonly refetch: () => Promise<unknown>;
}
