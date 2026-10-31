/**
 * Stackra file contract:
 * Purpose: the native `ExportDialog`: a Modal that slides up where the user picks a format, the columns, the rows
 *          (selection, filtered or all, with their counts) and the delivery (download or email), then exports; the
 *          export button spins while `onExport` runs, then shows a done tick, and the dialog closes a moment later. A
 *          progress bar fills while the file is prepared, from `onExport`'s `progress` or indeterminate.
 * Boundary: the web ExportDialog's contract and behaviour on the native Modal, RadioGroup, CheckboxGroup, ProgressBar
 *           and Button; the choices scroll when they outgrow the screen. Success and failure are announced through
 *           `AccessibilityInfo`; the failure also stays in the danger tone above the footer.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16 (owner decision 2026-10-28); STA-1371 (wave C: native
 *          ExportDialog).
 */
import type { ReactElement } from "react";
import { AccessibilityInfo, ScrollView } from "react-native";

import { EXPORT_DIALOG_KEYS } from "#core/constants/export-dialog-keys.constant";
import { useExportDialogState } from "#react/hooks/use-export-dialog-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { CheckboxGroup } from "#native/checkbox-group/checkbox-group";
import type { ExportDialogProps } from "#native/export-dialog/export-dialog.props";
import { Modal } from "#native/modal/modal";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { RadioGroup } from "#native/radio-group/radio-group";
import { Text } from "#native/text/text";

/** The dialog's words. */
const K = EXPORT_DIALOG_KEYS.ui.export_dialog;

/** Chooses a format, columns, rows and a delivery, then exports with a pending-to-done button. */
export function ExportDialog({
  trigger,
  title,
  description,
  ...choices
}: ExportDialogProps): ReactElement {
  const t = useUiText();
  const {
    open,
    setOpen,
    format,
    setFormat,
    chosen,
    setChosen,
    scope,
    setScope,
    delivery,
    setDelivery,
    scopes,
    deliveries,
    scopeOptions,
    deliveryOptions,
    phase,
    fraction,
    isPending,
    isDone,
    hasNoColumns,
    doneText,
    submit,
  } = useExportDialogState(choices);
  const isLocked = isPending || isDone;
  return (
    <Modal
      {...(trigger === undefined ? {} : { trigger })}
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable={!isPending}
      motion="slide-up"
      label={title ?? t(K.title)}
    >
      <Modal.Header>
        <Modal.Title>{title ?? t(K.title)}</Modal.Title>
        {description == null ? null : (
          <Text tone="muted" type="small">
            {description}
          </Text>
        )}
        <Modal.Close label={t(K.close)} isDisabled={isPending} />
      </Modal.Header>
      <ScrollView className="max-h-dialog-max-height" contentContainerClassName="gap-6 py-2">
        <RadioGroup
          label={t(K.format)}
          options={choices.formats}
          value={format}
          onChange={setFormat}
          orientation="horizontal"
          isDisabled={isLocked}
        />
        {scopes.length > 1 ? (
          <RadioGroup
            label={t(K.scope)}
            options={scopeOptions}
            value={scope}
            onChange={setScope}
            isDisabled={isLocked}
          />
        ) : null}
        {choices.columns === undefined ? null : (
          <CheckboxGroup
            label={t(K.columns)}
            options={choices.columns}
            value={chosen}
            onChange={setChosen}
            isInvalid={hasNoColumns}
            errorMessage={t(K.no_columns)}
            isDisabled={isLocked}
          />
        )}
        {deliveries.length > 1 ? (
          <RadioGroup
            label={t(K.delivery)}
            options={deliveryOptions}
            value={delivery}
            onChange={setDelivery}
            isDisabled={isLocked}
          />
        ) : null}
      </ScrollView>
      {isPending ? (
        <ProgressBar
          label={t(K.preparing)}
          {...(fraction === undefined ? {} : { value: Math.round(fraction * 100) })}
          isLabelVisible
          isValueVisible={fraction !== undefined}
          size="sm"
        />
      ) : null}
      {phase === "failed" ? (
        <Text tone="danger" type="small">
          {t(K.failed)}
        </Text>
      ) : null}
      <Modal.Footer>
        <Button variant="secondary" isDisabled={isPending} onPress={() => setOpen(false)}>
          {t(K.cancel)}
        </Button>
        <Button
          variant="primary"
          isLoading={isPending}
          isDisabled={hasNoColumns || isDone || format === ""}
          onPress={() =>
            void submit((isExported) =>
              AccessibilityInfo.announceForAccessibility(isExported ? doneText : t(K.failed)),
            )
          }
          {...(isDone ? { startIcon: "check" as const } : {})}
        >
          {isDone ? t(K.done) : t(K.export)}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
