/**
 * Stackra file contract:
 * Purpose: the native `ImportDialog`, the web one's counterpart: a stepper Drawer (a bottom sheet on a phone) with
 *          the same four steps: upload (a DropZone picker for CSV or Excel, with a template link), match the columns,
 *          review the dry run (new, updated, skipped and failed rows; the error list goes to the share sheet as CSV)
 *          and import (a progress bar, then a summary).
 * Boundary: composes the Stackra native Drawer, DropZone, ProgressBar, Link, Button and ImportFlow's mapping and review
 *           parts; reading the file, the dry run and the import are the app's. The sheet can't be dismissed while the
 *           import runs. Motion is the Drawer's, which follows the system's reduce-motion setting.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (owner request 2026-10-29).
 */
import type { ReactElement } from "react";
import { Share } from "react-native";

import type { PickedFile } from "#contracts/types/picked-file.type";
import { IMPORT_DIALOG_KEYS } from "#core/constants/import-dialog-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { importIssuesCsv } from "#core/functions/import-issues-csv.function";
import { isolatedFileNameOf } from "#core/functions/isolated-file-name-of.function";
import { useImportDialogState } from "#react/hooks/use-import-dialog-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { Drawer } from "#native/drawer/drawer";
import { DropZone } from "#native/drop-zone/drop-zone";
import type { ImportDialogProps } from "#native/import-dialog/import-dialog.props";
import { ImportMappingList } from "#native/import-flow/import-mapping-list";
import { ImportReview } from "#native/import-flow/import-review";
import { Link } from "#native/link/link";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { Text } from "#native/text/text";

/** The dialog's words. */
const K = IMPORT_DIALOG_KEYS.ui.import_dialog;
/** The mapping and review words, ImportFlow's. */
const F = UI_KEYS.ui.import_flow;

/** CSV and Excel. */
const SPREADSHEETS = [".csv", ".xlsx", ".xls"];

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
  } = useImportDialogState<PickedFile>({
    fields,
    onRead,
    onDryRun,
    onImport,
    isOpen,
    defaultOpen,
    onOpenChange,
  });

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
        <Drawer.Close label={t(K.close)} />
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
      <Drawer.Body className="gap-4">
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
            {templateUrl === undefined ? null : <Link href={templateUrl}>{t(K.template)}</Link>}
          </>
        ) : null}
        {step === "match" && file ? (
          <>
            <Text type="small" tone="muted">
              {file.preview.rowCount === undefined
                ? isolatedFileNameOf(file.name)
                : `${isolatedFileNameOf(file.name)} · ${t(K.file_rows, { count: file.preview.rowCount })}`}
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
              <Button
                size="sm"
                variant="secondary"
                onPress={() =>
                  void Share.share({
                    message: importIssuesCsv(dryRun.issues, [
                      t(K.error_row),
                      t(K.error_field),
                      t(K.error_message),
                    ]),
                  })
                }
              >
                {t(K.download_errors)}
              </Button>
            }
          />
        ) : null}
        {step === "import" ? (
          result ? (
            <>
              <Text accessibilityRole="header" className="text-base font-semibold">
                {t(K.done_title)}
              </Text>
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
          <Text accessibilityRole="alert" type="small" tone="danger">
            {t(failure)}
          </Text>
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
