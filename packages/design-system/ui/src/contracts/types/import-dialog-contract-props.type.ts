/**
 * Stackra file contract:
 * Purpose: `ImportDialogContractProps`, the props of every runtime's `ImportDialog`: the twin of the ExportDialog, a
 *          stepper Drawer that takes a file (with a template to start from), matches its columns to fields, shows a dry
 *          run (new, updated, skipped and failed rows, with a downloadable error list), then imports with progress and
 *          ends on a summary.
 * Boundary: types only. Reading the file, the dry run and the import are the app's; each runtime adds `onRead` for its
 *           own file type (a web `File`, a native `PickedFile`).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (owner request 2026-10-29).
 */
import type { ReactElement, ReactNode } from "react";

import type { ImportDryRun } from "#contracts/types/import-dry-run.type";
import type { ImportField } from "#contracts/types/import-field.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props shared by the web and native `ImportDialog`. */
export interface ImportDialogContractProps extends OpenStateContractProps {
  /** The fields a column can fill; the required ones must be matched before the file is checked. */
  readonly fields: readonly ImportField[];
  /** The extensions or MIME types taken. Defaults to CSV and Excel (`.csv`, `.xlsx`, `.xls`). */
  readonly acceptedFileTypes?: readonly string[] | undefined;
  /** Where the template file is; left out, there is no template link. */
  readonly templateUrl?: string | undefined;
  /** Checks the file with the mapping, saving nothing; the counts and problems come back for review. */
  readonly onDryRun: (mapping: ImportMapping) => Promise<ImportDryRun>;
  /**
   * Imports for real. Call `progress` with the share done, from 0 to 1, to fill the bar; never called, it stays
   * indeterminate. Resolve with the final counts, or with nothing to keep the dry run's; reject to offer a retry.
   */
  readonly onImport: (
    mapping: ImportMapping,
    progress: (fraction: number) => void,
    // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: resolving with nothing keeps the dry run's counts
  ) => Promise<ImportDryRun | void>;
  /** The element that opens the dialog; left out, the app opens it through `isOpen`. */
  readonly trigger?: ReactElement | undefined;
  /** The dialog's title; defaults to the catalogue's "Import". */
  readonly title?: string | undefined;
  /** One sentence under the title: what is being imported. */
  readonly description?: ReactNode;
}
