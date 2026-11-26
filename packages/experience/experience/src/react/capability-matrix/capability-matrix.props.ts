/**
 * Stackra file contract:
 * Purpose: `CapabilityMatrixProps`, the props of `CapabilityMatrix`.
 * Boundary: a type only; every word arrives resolved in the page's locale.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 2: Props in `<name>.props.ts`); ADR 0504; STA-2041.
 */
import type { CapabilityColumn } from "#core/types/capability-column.type";
import type { CapabilityRow } from "#core/types/capability-row.type";
import type { CapabilityStateLabels } from "#core/types/capability-state-labels.type";

/**
 * Subjects by capability, as an accessible table.
 *
 * @example
 * <CapabilityMatrix label="Carriers" rowHeader="Carrier" columns={columns} rows={rows} stateLabels={labels} />
 */
export interface CapabilityMatrixProps {
  /** The table's caption. */
  readonly label: string;
  /** The heading of the subjects' column. */
  readonly rowHeader: string;
  /** The capabilities, left to right. */
  readonly columns: readonly CapabilityColumn<string>[];
  /** The subjects, top to bottom. */
  readonly rows: readonly CapabilityRow<string>[];
  /** The words beside each state's icon. */
  readonly stateLabels: CapabilityStateLabels<string>;
  /** Styles the block. */
  readonly className?: string | undefined;
}
