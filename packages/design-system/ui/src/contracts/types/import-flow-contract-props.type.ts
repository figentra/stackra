/**
 * Stackra file contract:
 * Purpose: `ImportFlowContractProps`, the props of every runtime's `ImportFlow`: two steps after a file is read, mapping
 *          its columns to fields, then a dry run that shows what would happen before anything is saved.
 * Boundary: types only. The flow never parses files or saves rows: the app reads the file and runs the dry run.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ImportDryRun } from "#contracts/types/import-dry-run.type";
import type { ImportField } from "#contracts/types/import-field.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";

/** Props shared by the web and native `ImportFlow`. */
export interface ImportFlowContractProps {
  /** The file's column names, in order. */
  readonly columns: readonly string[];
  /** The first value of each column, shown as a hint beside it. */
  readonly sample?: Readonly<Record<string, string>> | undefined;
  readonly fields: readonly ImportField[];
  /** The mapping; leave it out to start from the automatic match. */
  readonly mapping?: ImportMapping | undefined;
  readonly onMappingChange?: ((mapping: ImportMapping) => void) | undefined;
  /** Called to check the file with the mapping; the result comes back as `dryRun`. */
  readonly onDryRun: (mapping: ImportMapping) => void;
  /** The dry run's result; the flow shows the review step while it is set. */
  readonly dryRun?: ImportDryRun | undefined;
  /** Called to import for real. */
  readonly onImport: (mapping: ImportMapping) => void;
  /** Called from the review step to change the mapping again. */
  readonly onBack?: (() => void) | undefined;
  /** True while the dry run or the import runs. */
  readonly isBusy?: boolean | undefined;
}
