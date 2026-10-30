/**
 * Stackra file contract:
 * Purpose: `useImportDialogState(props)`, the state every runtime's ImportDialog shares: open or closed (controlled or
 *          its own; closing starts the next opening over at the upload step), the step and its place among the four
 *          (upload, match, review, import), the file read, the column mapping (first guessed by `importMappingOf`),
 *          the dry run, the import's progress and result, the busy state and the last error, and the moves between
 *          the steps: read a file, check it, run the import (again after a failure) and go back.
 * Boundary: a React hook with no rendering; reading the file, the dry run and the import are the app's. A throw from
 *           any of them shows its catalogue key and leaves the step as it is. The runtimes pick or drop the file and
 *           hand the error list to a download or the share sheet. The web and native ImportDialog both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (owner request 2026-10-29).
 */
import type { I18nKey } from "@stackra/i18n";
import { useState } from "react";

import type { ImportDialogContractProps } from "#contracts/types/import-dialog-contract-props.type";
import type { ImportDryRun } from "#contracts/types/import-dry-run.type";
import type { ImportMapping } from "#contracts/types/import-mapping.type";
import type { ImportPreview } from "#contracts/types/import-preview.type";
import { IMPORT_DIALOG_KEYS } from "#core/constants/import-dialog-keys.constant";
import { importMappingOf } from "#core/functions/import-mapping-of.function";
import { unmappedRequiredOf } from "#core/functions/unmapped-required-of.function";

/** The dialog's words. */
const K = IMPORT_DIALOG_KEYS.ui.import_dialog;

/** The steps, in order. */
const STEPS = ["upload", "match", "review", "import"] as const;
/** The catalogue key of each step's name. */
const STEP_KEY = {
  upload: K.step_upload,
  match: K.step_match,
  review: K.step_review,
  import: K.step_import,
};

/** A step of the dialog. */
type Step = (typeof STEPS)[number];

/**
 * The shared ImportDialog state.
 * @param props - the fields, the app's read, dry run and import, and the open state
 * @returns the step and everything it shows, and the moves between the steps
 */
export function useImportDialogState<TFile extends { readonly name: string }>({
  fields,
  onRead,
  onDryRun,
  onImport,
  isOpen,
  defaultOpen,
  onOpenChange,
}: Pick<
  ImportDialogContractProps,
  "fields" | "onDryRun" | "onImport" | "isOpen" | "defaultOpen" | "onOpenChange"
> & {
  readonly onRead: (file: TFile) => Promise<ImportPreview>;
}): {
  readonly open: boolean;
  readonly setOpen: (next: boolean) => void;
  readonly step: Step;
  readonly stepKey: I18nKey;
  readonly index: number;
  readonly total: number;
  readonly file: { readonly name: string; readonly preview: ImportPreview } | undefined;
  readonly mapping: ImportMapping;
  readonly setMapping: (mapping: ImportMapping) => void;
  readonly dryRun: ImportDryRun | undefined;
  readonly result: ImportDryRun | undefined;
  readonly fraction: number | undefined;
  readonly failure: I18nKey | undefined;
  readonly isBusy: boolean;
  readonly isImporting: boolean;
  readonly isMissingRequired: boolean;
  readonly go: (next: Step) => void;
  readonly read: (files: readonly TFile[]) => void;
  readonly check: () => void;
  readonly run: () => void;
} {
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<{ name: string; preview: ImportPreview } | undefined>(undefined);
  const [mapping, setMapping] = useState<ImportMapping>({});
  const [dryRun, setDryRun] = useState<ImportDryRun | undefined>(undefined);
  const [result, setResult] = useState<ImportDryRun | undefined>(undefined);
  const [fraction, setFraction] = useState<number | undefined>(undefined);
  const [failure, setFailure] = useState<I18nKey | undefined>(undefined);
  const [isBusy, setBusy] = useState(false);

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

  /** Runs `work` with the busy state on; a throw shows `failed` (a catalogue key) and leaves the step as it is. */
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

  return {
    open: isOpen ?? innerOpen,
    setOpen,
    step,
    stepKey: STEP_KEY[step],
    index: STEPS.indexOf(step),
    total: STEPS.length,
    file,
    mapping,
    setMapping,
    dryRun,
    result,
    fraction,
    failure,
    isBusy,
    isImporting: step === "import" && result === undefined && failure === undefined,
    isMissingRequired: unmappedRequiredOf(fields, mapping).length > 0,
    go: (next) => {
      setFailure(undefined);
      setStep(next);
    },
    read: (files) => {
      const chosen = files[0];
      if (chosen === undefined) return;
      void attempt(async () => {
        const preview = await onRead(chosen);
        setFile({ name: chosen.name, preview });
        setMapping(importMappingOf(preview.columns, fields));
        setStep("match");
      }, K.read_failed);
    },
    check: () =>
      void attempt(async () => {
        setDryRun(await onDryRun(mapping));
        setStep("review");
      }, K.check_failed),
    run: () => {
      setStep("import");
      setResult(undefined);
      setFraction(undefined);
      void attempt(async () => {
        setResult((await onImport(mapping, setFraction)) ?? dryRun);
      }, K.import_failed);
    },
  };
}
