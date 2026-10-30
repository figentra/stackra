/**
 * Stackra file contract:
 * Purpose: the web `ExportDialog`: a Modal where the user picks a format, the columns, the rows (selection, filtered
 *          or all, with their counts) and the delivery (download or email), then exports; the export button morphs
 *          from a spinner while `onExport` runs to a done tick, and the dialog closes a moment later. The header (title,
 *          description, close) and the footer (Cancel, Export) are ruled off from the body, as the Drawer's are; a
 *          progress bar fills while the file is prepared, from `onExport`'s `progress` or indeterminate.
 * Boundary: composes the Stackra Modal, RadioGroup, CheckboxGroup, ProgressBar and Button; no styling of its own
 *           beyond layout.
 *           The tick's entrance follows `prefers-reduced-motion` (it simply appears). Success is announced in a
 *           polite status region, a failure in an alert. Web only (GAPS.md row 16).
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5: adapted form); ADR 0303 (decision 7); GAPS.md row 16 (owner
 *          decision 2026-10-28, P1 + P2 core); WCAG 2.2 SC 3.3.1 and 4.1.3.
 */
import type { ReactElement } from "react";
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { motion, useReducedMotion } from "motion/react";

import { EXPORT_DIALOG_KEYS } from "#core/constants/export-dialog-keys.constant";
import { Button } from "#react/button/button";
import { CheckboxGroup } from "#react/checkbox-group/checkbox-group";
import { useExportDialogState } from "#react/hooks/use-export-dialog-state";
import { Icon } from "#react/icon/icon";
import { useUiText } from "#react/hooks/use-ui-text";
import { Modal } from "#react/modal/modal";
import { ProgressBar } from "#react/progress-bar/progress-bar";
import { RadioGroup } from "#react/radio-group/radio-group";
import { Text } from "#react/text/text";
import type { ExportDialogProps } from "#react/export-dialog/export-dialog.props";

/** The dialog's words. */
const K = EXPORT_DIALOG_KEYS.ui.export_dialog;

/** The tick's entrance. */
const MORPH = motionTiming(STACKRA_THEME, "fast");

/** Chooses a format, columns, rows and a delivery, then exports with a pending-to-done button. */
export function ExportDialog({
  trigger,
  title,
  description,
  ...choices
}: ExportDialogProps): ReactElement {
  const t = useUiText();
  const isReduced = useReducedMotion() ?? false;
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
  return (
    <Modal
      {...(trigger === undefined ? {} : { trigger })}
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable={!isPending}
      size="md"
      className="p-0"
    >
      <Modal.Header className="gap-1 border-b border-separator px-6 pt-5 pb-4 pe-14">
        <Modal.Title>{title ?? t(K.title)}</Modal.Title>
        {description == null ? null : (
          <Text tone="muted" type="small">
            {description}
          </Text>
        )}
        <Modal.Close label={t(K.close)} isDisabled={isPending} />
      </Modal.Header>
      <Modal.Body className="mt-0 grid gap-6 px-6 py-5">
        <RadioGroup
          label={t(K.format)}
          options={choices.formats}
          value={format}
          onChange={setFormat}
          orientation="horizontal"
          isDisabled={isPending || isDone}
        />
        {scopes.length > 1 ? (
          <RadioGroup
            label={t(K.scope)}
            options={scopeOptions}
            value={scope}
            onChange={setScope}
            isDisabled={isPending || isDone}
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
            isDisabled={isPending || isDone}
            columns={2}
          />
        )}
        {deliveries.length > 1 ? (
          <RadioGroup
            label={t(K.delivery)}
            options={deliveryOptions}
            value={delivery}
            onChange={setDelivery}
            isDisabled={isPending || isDone}
          />
        ) : null}
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
          <Text role="alert" tone="danger" type="small">
            {t(K.failed)}
          </Text>
        ) : null}
        <p role="status" className="sr-only">
          {isDone ? doneText : ""}
        </p>
      </Modal.Body>
      <Modal.Footer className="mt-0 border-t border-separator px-6 py-4">
        <Button variant="secondary" isDisabled={isPending} onPress={() => setOpen(false)}>
          {t(K.cancel)}
        </Button>
        <Button
          variant="primary"
          isLoading={isPending}
          isDisabled={hasNoColumns || isDone || format === ""}
          onPress={() => void submit()}
          data-phase={phase}
          {...(isDone
            ? {
                startIcon: (
                  <motion.span
                    data-slot="export-done-tick"
                    className="inline-flex"
                    initial={isReduced ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: MORPH.durationMs / 1000, ease: "easeOut" }}
                    aria-hidden
                  >
                    <Icon name="check" size="sm" />
                  </motion.span>
                ),
              }
            : {})}
        >
          {isDone ? t(K.done) : t(K.export)}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
