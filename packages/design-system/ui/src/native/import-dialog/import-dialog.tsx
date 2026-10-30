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
import type { I18nKey } from "@stackra/i18n";
import { type ReactElement, useState } from "react";
import { Share } from "react-native";

import type { ImportDryRun } from "#contracts/types/import-dry-run.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";
import type { ImportPreview } from "#contracts/types/import-preview.type";
import type { PickedFile } from "#contracts/types/picked-file.type";
import { IMPORT_DIALOG_KEYS } from "#core/constants/import-dialog-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { importIssuesCsv } from "#core/functions/import-issues-csv.function";
import { importMappingOf } from "#core/functions/import-mapping-of.function";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";
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

/** The steps, in order. */
const STEPS = ["upload", "match", "review", "import"] as const;
/** The catalogue key of each step's name. */
const STEP_KEY = {
  upload: K.step_upload,
  match: K.step_match,
  review: K.step_review,
  import: K.step_import,
};
/** CSV and Excel. */
const SPREADSHEETS = [".csv", ".xlsx", ".xls"];

/** The file read in the first step. */
interface ReadFile {
  readonly name: string;
  readonly preview: ImportPreview;
}

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
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const [step, setStep] = useState<(typeof STEPS)[number]>("upload");
  const [file, setFile] = useState<ReadFile | undefined>(undefined);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dryRun, setDryRun] = useState<ImportDryRun | undefined>(undefined);
  const [result, setResult] = useState<ImportDryRun | undefined>(undefined);
  const [fraction, setFraction] = useState<number | undefined>(undefined);
  const [failure, setFailure] = useState<I18nKey | undefined>(undefined);
  const [isBusy, setBusy] = useState(false);
  const open = isOpen ?? innerOpen;
  const isImporting = step === "import" && result === undefined && failure === undefined;

  const setOpen = (next: boolean) => {
    if (!next) {
      setStep("upload");
      setFile(undefined);
      setDryRun(undefined);
      setResult(undefined);
      setFailure(undefined);
    }
    if (isOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const attempt = async (work: () => Promise<void>, failed: I18nKey) => {
    setBusy(true);
    setFailure(undefined);
    try {
      await work();
    } catch {
      setFailure(failed);
    } finally {
      setBusy(false);
    }
  };
  const go = (next: (typeof STEPS)[number]) => {
    setFailure(undefined);
    setStep(next);
  };
  const read = (files: readonly PickedFile[]) => {
    const chosen = files[0];
    if (chosen === undefined) return;
    void attempt(async () => {
      const preview = await onRead(chosen);
      setFile({ name: chosen.name, preview });
      setMapping(importMappingOf(preview.columns, fields));
      setStep("match");
    }, K.read_failed);
  };
  const check = () =>
    void attempt(async () => {
      setDryRun(await onDryRun(mapping));
      setStep("review");
    }, K.check_failed);
  const run = () => {
    setStep("import");
    setResult(undefined);
    setFraction(undefined);
    void attempt(async () => {
      setResult((await onImport(mapping, setFraction)) ?? dryRun);
    }, K.import_failed);
  };

  const index = STEPS.indexOf(step);
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
          label={t(STEP_KEY[step])}
          valueLabel={t(K.step_of, { step: index + 1, total: STEPS.length })}
          value={index + 1}
          maxValue={STEPS.length}
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
                ? file.name
                : `${file.name} · ${t(K.file_rows, { count: file.preview.rowCount })}`}
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
            <Button
              isLoading={isBusy}
              isDisabled={unmappedRequiredOf(fields, mapping).length > 0}
              onPress={check}
            >
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
