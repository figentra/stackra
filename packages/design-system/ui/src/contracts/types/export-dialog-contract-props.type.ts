/**
 * Stackra file contract:
 * Purpose: the props of the `ExportDialog`: the formats, columns and scopes on offer, the deliveries, the trigger and
 *          open state, and `onExport`, whose promise drives the export button from pending to done.
 * Boundary: types only; web only (GAPS.md row 16). The words of the dialog's own chrome are the `ui` catalogue's; a
 *           caller's `title` wins.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16 (owner decision 2026-10-28, P1 + P2 core); WCAG 2.2 SC
 *          4.1.3.
 */
import type { ReactElement, ReactNode } from "react";

import type { ExportDelivery } from "#contracts/enums/export-delivery.enum";
import type { ExportScope } from "#contracts/enums/export-scope.enum";
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { ExportRequest } from "#contracts/types/export-request.type";
import type { OpenStateContractProps } from "#contracts/types/open-state-contract-props.type";

/** Props of the ExportDialog. */
export interface ExportDialogContractProps extends OpenStateContractProps {
  /** The file formats (CSV, Excel, PDF); the first is chosen unless `defaultValue` says otherwise. */
  readonly formats: readonly ChoiceOption[];
  /** The columns the user may leave out, all ticked at first. Left out, there is no column picker. */
  readonly columns?: readonly ChoiceOption[] | undefined;
  /**
   * The row count of each scope on offer; a scope without a count is not offered, and one with 0 rows is disabled.
   * The narrowest scope with rows is chosen first, so a selection is exported when there is one.
   */
  readonly counts: Readonly<Partial<Record<ExportScope, number>>>;
  /** The deliveries on offer; with one, there is no picker. Defaults to `["download"]`. */
  readonly deliveries?: readonly ExportDelivery[] | undefined;
  /** The address an emailed export goes to, shown beside the email choice. */
  readonly email?: string | undefined;
  /** The starting choices. */
  readonly defaultValue?: Partial<ExportRequest> | undefined;
  /**
   * Runs the export. While its promise is pending the export button shows a spinner and a progress bar runs above
   * the footer; when it resolves the button turns into a done tick and the dialog closes; when it rejects the dialog
   * stays open with an error. Call `progress` with the share done, from 0 to 1, to fill the bar; never called, the bar
   * stays indeterminate.
   */
  readonly onExport: (
    request: ExportRequest,
    progress: (fraction: number) => void,
    // oxlint-disable-next-line typescript/no-invalid-void-type -- reason: the handler may return nothing when the file is ready at once
  ) => Promise<unknown> | void;
  /** The element that opens the dialog; left out, the app opens it through `isOpen`. */
  readonly trigger?: ReactElement | undefined;
  /** The dialog's title; defaults to the catalogue's "Export". */
  readonly title?: string | undefined;
  /** One sentence under the title: what is being exported. */
  readonly description?: ReactNode;
}
