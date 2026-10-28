/**
 * Stackra file contract:
 * Purpose: `SearchModelUnknownError`, the refusal of a reindex that names a model this process has not registered as
 *          `@Searchable` (`search_model_unknown`).
 * Boundary: raised by the reindex jobs before any row is read; kind `NotFound`, not retryable: only a registration (a
 *           deploy) changes the answer. It carries the model name the caller gave in its details.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0404 (decision 3); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: the model is not registered in this service.
 *
 * @example
 * throw SearchModelUnknownError.create({ model: "Prodct" });
 */
export class SearchModelUnknownError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {
  /** The model name the reindex named. */
  model!: string;
}
