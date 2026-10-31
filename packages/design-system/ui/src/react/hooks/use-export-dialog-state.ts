/**
 * Stackra file contract:
 * Purpose: `useExportDialogState(props)`, the state every runtime's ExportDialog shares: open or closed (controlled or
 *          its own), the format, columns, rows and delivery chosen (from `defaultValue`, else the first format, every
 *          column, the first scope with rows and the first delivery), the scope and delivery choices in the reader's
 *          words, the export's progress, and its phase: idle, done (the dialog closes a moment later) or failed.
 *          Opening the dialog again starts idle.
 * Boundary: a React hook with no rendering; `onExport` runs through `usePendingPress`, so a second press while it runs
 *           does nothing. The runtimes announce the outcome their own way through `submit`'s callback. The web and
 *           native ExportDialog both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 16 (owner decision 2026-10-28); STA-1371.
 */
import { useEffect, useRef, useState } from "react";

import type { ExportDelivery } from "#contracts/enums/export-delivery.enum";
import { ExportScope } from "#contracts/enums/export-scope.enum";
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { ExportDialogContractProps } from "#contracts/types/export-dialog-contract-props.type";
import { EXPORT_DIALOG_KEYS } from "#core/constants/export-dialog-keys.constant";
import { usePendingPress } from "#react/hooks/use-pending-press";
import { useUiText } from "#react/hooks/use-ui-text";

/** The default deliveries: one stable array, not a new one each render. */
const DOWNLOAD_ONLY = ["download"] as const;

/** The dialog's words. */
const K = EXPORT_DIALOG_KEYS.ui.export_dialog;

/** How long the done tick shows before the dialog closes, in milliseconds. */
// oxlint-disable-next-line stackra/no-literal-duration -- how long the done tick dwells, not motion
const DONE_MS = 1200;

/** The catalogue key of each scope's label. */
const SCOPE_KEY = { selection: K.scope_selection, filtered: K.scope_filtered, all: K.scope_all };

/**
 * The shared ExportDialog state.
 * @param props - the dialog's choices, counts, default request, export handler and open state
 * @returns the choices made, their options, the phase and the functions that open, close and export
 */
export function useExportDialogState({
  formats,
  columns,
  counts,
  deliveries = DOWNLOAD_ONLY,
  email,
  defaultValue,
  onExport,
  isOpen,
  defaultOpen,
  onOpenChange,
}: Omit<ExportDialogContractProps, "trigger" | "title" | "description">): {
  readonly open: boolean;
  readonly setOpen: (next: boolean) => void;
  readonly format: string;
  readonly setFormat: (format: string) => void;
  readonly chosen: readonly string[];
  readonly setChosen: (chosen: readonly string[]) => void;
  readonly scope: ExportScope;
  readonly setScope: (scope: string) => void;
  readonly delivery: ExportDelivery;
  readonly setDelivery: (delivery: string) => void;
  readonly scopes: readonly ExportScope[];
  readonly deliveries: readonly ExportDelivery[];
  readonly scopeOptions: readonly ChoiceOption[];
  readonly deliveryOptions: readonly ChoiceOption[];
  readonly phase: "idle" | "done" | "failed";
  readonly fraction: number | undefined;
  readonly isPending: boolean;
  readonly isDone: boolean;
  readonly hasNoColumns: boolean;
  readonly doneText: string;
  readonly submit: (onSettled?: (isDone: boolean) => void) => Promise<void>;
} {
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

  return {
    open,
    setOpen,
    format,
    setFormat,
    chosen,
    setChosen,
    scope,
    setScope: (next) => setScope(next as ExportScope),
    delivery,
    setDelivery: (next) => setDelivery(next as ExportDelivery),
    scopes,
    deliveries,
    scopeOptions: scopes.map((each) => ({
      value: each,
      label: t(SCOPE_KEY[each], { count: counts[each] ?? 0 }),
      isDisabled: counts[each] === 0,
    })),
    deliveryOptions: deliveries.map((each) => ({
      value: each,
      label: each === "email" && email !== undefined ? t(K.email_to, { email }) : t(K[each]),
    })),
    phase,
    fraction,
    isPending,
    isDone: phase === "done",
    hasNoColumns: columns !== undefined && chosen.length === 0,
    doneText: t(delivery === "email" ? K.done_email : K.done_download),
    submit: async (onSettled) => {
      setPhase("idle");
      setFraction(undefined);
      const isDone = await press({ format, columns: chosen, scope, delivery }, setFraction);
      setPhase(isDone ? "done" : "failed");
      onSettled?.(isDone);
      if (isDone) closing.current = setTimeout(() => setOpen(false), DONE_MS);
    },
  };
}
