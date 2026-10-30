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
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ScrollView } from "react-native";

import { ExportScope } from "#contracts/enums/export-scope.enum";
import type { ExportDelivery } from "#contracts/enums/export-delivery.enum";
import { EXPORT_DIALOG_KEYS } from "#core/constants/export-dialog-keys.constant";
import { usePendingPress } from "#react/hooks/use-pending-press";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { CheckboxGroup } from "#native/checkbox-group/checkbox-group";
import type { ExportDialogProps } from "#native/export-dialog/export-dialog.props";
import { Modal } from "#native/modal/modal";
import { ProgressBar } from "#native/progress-bar/progress-bar";
import { RadioGroup } from "#native/radio-group/radio-group";
import { Text } from "#native/text/text";

/** The default deliveries: one stable array, not a new one each render. */
const DOWNLOAD_ONLY = ["download"] as const;

/** The dialog's words. */
const K = EXPORT_DIALOG_KEYS.ui.export_dialog;

/** How long the done tick shows before the dialog closes, in milliseconds. */
const DONE_MS = 1200;

/** The catalogue key of each scope's label. */
const SCOPE_KEY = { selection: K.scope_selection, filtered: K.scope_filtered, all: K.scope_all };

/** Chooses a format, columns, rows and a delivery, then exports with a pending-to-done button. */
export function ExportDialog({
  formats,
  columns,
  counts,
  deliveries = DOWNLOAD_ONLY,
  email,
  defaultValue,
  onExport,
  trigger,
  title,
  description,
  isOpen,
  defaultOpen,
  onOpenChange,
}: ExportDialogProps): ReactElement {
  const t = useUiText();
  const scopes = ExportScope.filter((scope) => counts[scope] !== undefined);
  const [format, setFormat] = useState(defaultValue?.format ?? formats[0]?.value ?? "");
  const [chosen, setChosen] = useState<readonly string[]>(
    defaultValue?.columns ?? columns?.map((column) => column.value) ?? [],
  );
  const [scope, setScope] = useState(
    defaultValue?.scope ?? scopes.find((each) => (counts[each] ?? 0) > 0) ?? scopes[0] ?? "all",
  );
  const [delivery, setDelivery] = useState<ExportDelivery>(
    defaultValue?.delivery ?? deliveries[0] ?? "download",
  );
  const [phase, setPhase] = useState<"idle" | "done" | "failed">("idle");
  const [fraction, setFraction] = useState<number | undefined>(undefined);
  const [innerOpen, setInnerOpen] = useState(defaultOpen ?? false);
  const open = isOpen ?? innerOpen;
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(closing.current), []);

  const setOpen = (next: boolean) => {
    clearTimeout(closing.current);
    if (next) setPhase("idle");
    if (isOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const { isPending, press } = usePendingPress(onExport);
  const hasNoColumns = columns !== undefined && chosen.length === 0;

  const submit = async () => {
    setPhase("idle");
    setFraction(undefined);
    const isDone = await press({ format, columns: chosen, scope, delivery }, setFraction);
    setPhase(isDone ? "done" : "failed");
    AccessibilityInfo.announceForAccessibility(
      isDone ? t(delivery === "email" ? K.done_email : K.done_download) : t(K.failed),
    );
    if (isDone) closing.current = setTimeout(() => setOpen(false), DONE_MS);
  };

  const isDone = phase === "done";
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
      <ScrollView className="max-h-[480px]" contentContainerClassName="gap-6 py-2">
        <RadioGroup
          label={t(K.format)}
          options={formats}
          value={format}
          onChange={setFormat}
          orientation="horizontal"
          isDisabled={isLocked}
        />
        {scopes.length > 1 ? (
          <RadioGroup
            label={t(K.scope)}
            options={scopes.map((each) => ({
              value: each,
              label: t(SCOPE_KEY[each], { count: counts[each] ?? 0 }),
              isDisabled: counts[each] === 0,
            }))}
            value={scope}
            onChange={(next) => setScope(next as typeof scope)}
            isDisabled={isLocked}
          />
        ) : null}
        {columns === undefined ? null : (
          <CheckboxGroup
            label={t(K.columns)}
            options={columns}
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
            options={deliveries.map((each) => ({
              value: each,
              label:
                each === "email" && email !== undefined ? t(K.email_to, { email }) : t(K[each]),
            }))}
            value={delivery}
            onChange={(next) => setDelivery(next as ExportDelivery)}
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
          onPress={() => void submit()}
          {...(isDone ? { startIcon: "check" as const } : {})}
        >
          {isDone ? t(K.done) : t(K.export)}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
