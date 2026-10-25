/**
 * Stackra file contract:
 * Purpose: `PrintedLabel`, what a successful label print answers: which printer took which job.
 * Boundary: a type only. `printer` names the printer as its driver knows it; shown to the user, never sent to a server
 *           by this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1).
 */

/** A label job the printer accepted. */
export interface PrintedLabel {
  /** The printer that took the job. */
  readonly printer: string;

  /** The job, as given. */
  readonly jobId: string;
}
