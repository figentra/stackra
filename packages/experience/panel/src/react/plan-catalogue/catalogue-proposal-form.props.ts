/**
 * Stackra file contract:
 * Purpose: `CatalogueProposalFormProps`, the props of the plan-catalogue admin's proposal form: the record, the rows it
 *          starts from, the tenant's time zone, and the handler that sends the proposal.
 * Boundary: types only; `onPropose` calls the OS billing propose action, which runs `PlanCatalogueService.propose`.
 * Runtime: browser
 * Governing contract: ADR 0391 (decisions 2 to 5); owner OS-82, OS-381.
 */
import type { CatalogueProposal } from "@stackra/entitlements";
import type { CatalogueRow } from "@stackra/contracts";

/** Props of `CatalogueProposalForm`. */
export interface CatalogueProposalFormProps {
  /** The record key (`price-list:commerce`). */
  readonly recordKey: string;
  /** The record kind (`plan-catalogue`, `price-list`, `offer`, `fee-schedule`, `rate-card`). */
  readonly kind: string;
  /** The rows the change starts from: the latest approved version's. */
  readonly current: readonly CatalogueRow[];
  /** The tenant's IANA time zone (a setting), in which the chosen day starts. */
  readonly timeZone: string;
  /** Called with the proposal; a rejection is shown by the caller's action runner. */
  readonly onPropose: (proposal: CatalogueProposal) => void;
}
