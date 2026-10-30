/**
 * Stackra file contract:
 * Purpose: the web `ImportDialog`, the ExportDialog's twin: a stepper Drawer that opens from a button and walks four
 *          steps: upload (a DropZone for CSV or Excel, with a template link), match the columns (ImportFlow's
 *          mapping), review the dry run (new, updated, skipped and failed rows, with the error list as a CSV download)
 *          and import (a progress bar, then a summary). The sub-header shows the step; the footer moves Back and on.
 * Boundary: composes the Stackra Drawer, DropZone, ProgressBar, Link, Button and ImportFlow's mapping and review
 *           parts; reading the file, the dry run and the import are the app's. A Drawer, not a Modal: the steps need a
 *           fixed header, a step band and footer around a body that scrolls (a long column list, a long error list).
 *           The drawer can't be dismissed while the import runs. Motion is the Drawer's and ProgressBar's, both of which
 *           follow `prefers-reduced-motion`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29); WCAG 2.2 SC 1.3.1, 3.3.1 and 4.1.3.
 */
import type { ReactElement } from "react";

import type { ImportIssue } from "#contracts/types/import-issue.type";
import { IMPORT_DIALOG_KEYS } from "#core/constants/import-dialog-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { importIssuesCsv } from "#core/functions/import-issues-csv.function";
import { Button } from "#react/button/button";
import { Drawer } from "#react/drawer/drawer";
import { DropZone } from "#react/drop-zone/drop-zone";
import { FileName } from "#react/file-name/file-name";
import { useImportDialogState } from "#react/hooks/use-import-dialog-state";
import { useUiText } from "#react/hooks/use-ui-text";
import type { ImportDialogProps } from "#react/import-dialog/import-dialog.props";
import { ImportMappingList } from "#react/import-flow/import-mapping-list";
import { ImportReview } from "#react/import-flow/import-review";
import { Link } from "#react/link/link";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import { Text } from "#react/text/text";

/** The dialog's words. */
const K = IMPORT_DIALOG_KEYS.ui.import_dialog;
/** The mapping and review words, ImportFlow's. */
const F = UI_KEYS.ui.import_flow;

/** CSV and Excel. */
const SPREADSHEETS = [".csv", ".xlsx", ".xls"];
/** The error list's file name (file names stay Latin). */
const ERRORS_FILE = "import-errors.csv";

/** Upload, match, review, import: a file into the app in four steps. */
export function ImportDialog({
  fields,
  acceptedFileTypes = SPREADSHEETS,
  templateUrl,
  onRead,
  onDryRun,
  onImport,
  trigger,
  title,
  description,
  isOpen,
  defaultOpen,
  onOpenChange,
}: ImportDialogProps): ReactElement {
  const t = useUiText();
  const {
    open,
    setOpen,
    step,
    stepKey,
    index,
    total,
    file,
    mapping,
    setMapping,
    dryRun,
    result,
    fraction,
    failure,
    isBusy,
    isImporting,
    isMissingRequired,
    go,
    read,
    check,
    run,
  } = useImportDialogState<File>({
    fields,
    onRead,
    onDryRun,
    onImport,
    isOpen,
    defaultOpen,
    onOpenChange,
  });

  const downloadIssues = (issues: readonly ImportIssue[]) => {
    const csv = importIssuesCsv(issues, [t(K.error_row), t(K.error_field), t(K.error_message)]);
    // The byte-order mark makes Excel read the file as UTF-8, so Arabic stays Arabic.
    const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = ERRORS_FILE;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Drawer
      {...(trigger === undefined ? {} : { trigger })}
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable={!isImporting}
      isKeyboardDismissDisabled={isImporting}
      size="lg"
    >
      <Drawer.Header>
        <Drawer.Title>{title ?? t(K.title)}</Drawer.Title>
        {description == null ? null : <Drawer.Description>{description}</Drawer.Description>}
        <Drawer.Close label={t(K.close)} isDisabled={isImporting} />
      </Drawer.Header>
      <Drawer.SubHeader>
        <ProgressBar
          label={t(stepKey)}
          valueLabel={t(K.step_of, { step: index + 1, total })}
          value={index + 1}
          maxValue={total}
          isLabelVisible
          isValueVisible
          size="sm"
        />
      </Drawer.SubHeader>
      <Drawer.Body className="flex flex-col gap-5" data-step={step}>
        {step === "upload" ? (
          <>
            <DropZone
              label={t(K.upload_label)}
              description={t(K.upload_hint)}
              acceptedFileTypes={acceptedFileTypes}
              isDisabled={isBusy}
              onSelect={read}
            />
            {isBusy ? <ProgressBar label={t(K.reading)} isLabelVisible size="sm" /> : null}
            {templateUrl === undefined ? null : (
              <Link href={templateUrl} download className="self-start text-sm">
                {t(K.template)}
              </Link>
            )}
          </>
        ) : null}
        {step === "match" && file ? (
          <>
            <Text type="small" tone="muted">
              <FileName name={file.name} />
              {file.preview.rowCount === undefined
                ? null
                : ` · ${t(K.file_rows, { count: file.preview.rowCount })}`}
            </Text>
            <ImportMappingList
              columns={file.preview.columns}
              sample={file.preview.sample}
              fields={fields}
              mapping={mapping}
              onChange={setMapping}
            />
          </>
        ) : null}
        {step === "review" && dryRun ? (
          <ImportReview
            result={dryRun}
            issuesAction={
              <Button size="sm" variant="secondary" onPress={() => downloadIssues(dryRun.issues)}>
                {t(K.download_errors)}
              </Button>
            }
          />
        ) : null}
        {step === "import" ? (
          result ? (
            <>
              <h3 className="m-0 text-base font-semibold text-foreground">{t(K.done_title)}</h3>
              <ImportReview result={result} isDone />
            </>
          ) : failure ? null : (
            <ProgressBar
              label={t(K.importing)}
              {...(fraction === undefined ? {} : { value: Math.round(fraction * 100) })}
              isLabelVisible
              isValueVisible={fraction !== undefined}
            />
          )
        ) : null}
        {failure ? (
          <p role="alert" className="m-0 text-sm text-danger">
            {t(failure)}
          </p>
        ) : null}
      </Drawer.Body>
      <Drawer.Footer>
        {step === "upload" ? (
          <Button variant="secondary" onPress={() => setOpen(false)}>
            {t(K.cancel)}
          </Button>
        ) : null}
        {step === "match" ? (
          <>
            <Button variant="secondary" isDisabled={isBusy} onPress={() => go("upload")}>
              {t(K.back)}
            </Button>
            <Button isLoading={isBusy} isDisabled={isMissingRequired} onPress={check}>
              {t(F.check)}
            </Button>
          </>
        ) : null}
        {step === "review" && dryRun ? (
          <>
            <Button variant="secondary" onPress={() => go("match")}>
              {t(F.back)}
            </Button>
            <Button isDisabled={dryRun.created + dryRun.updated === 0} onPress={run}>
              {t(F.import)}
            </Button>
          </>
        ) : null}
        {step === "import" && result ? (
          <Button onPress={() => setOpen(false)}>{t(K.done)}</Button>
        ) : null}
        {step === "import" && failure ? (
          <>
            <Button variant="secondary" onPress={() => go("review")}>
              {t(K.back)}
            </Button>
            <Button onPress={run}>{t(K.retry)}</Button>
          </>
        ) : null}
      </Drawer.Footer>
    </Drawer>
  );
}
