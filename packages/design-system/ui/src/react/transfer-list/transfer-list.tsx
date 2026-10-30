/**
 * Stackra file contract:
 * Purpose: the web `TransferList`: a labelled field of two lists side by side, the available items and the chosen
 *          ones, each with a count, a filter, ticks and a "move all" for what the filter shows, and between them two
 *          buttons that move the ticked items across. Their arrows point at the list they move to, so they mirror in
 *          right-to-left, where the available list sits on the right. Each move is announced ("3 items moved").
 * Boundary: composes the house Listbox, SearchField, Button and IconButton; the value is the chosen keys in the order
 *           of `items`, submitted under `name` from hidden inputs. A disabled item stays where it is.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); ADR 0060 (right-to-left); STA-1371 (wave
 *          D, owner approval 2026-10-30); WCAG 2.2 SC 1.3.1, 4.1.2, 4.1.3.
 */
import { cn, Description, Label } from "@heroui/react";
import { useId, useState, type ReactElement } from "react";
import { VisuallyHidden } from "react-aria-components";

import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { transferKeys } from "#core/functions/transfer-keys.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { TransferListSide } from "#react/transfer-list/transfer-list-side";
import type { TransferListProps } from "#react/transfer-list/transfer-list.props";

/** The transfer list's words. */
const K = OVERLAY_SELECTION_KEYS.ui.transfer_list;

// Below 32rem the lists stack, so the chevrons turn to point down and up (counter-turned where RTL mirrors them).
const TURN = "rotate-90 rtl:-rotate-90 @lg:rotate-0 @lg:rtl:rotate-0";

/** Nothing chosen or ticked yet. */
const NONE: readonly string[] = [];

/** Two lists to move items between. */
export function TransferList({
  items,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled = false,
  isRequired,
  availableLabel,
  chosenLabel,
  value,
  defaultValue,
  onChange,
  name,
  className,
}: TransferListProps): ReactElement {
  const t = useUiText();
  const id = useId();
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const chosen = value ?? own;
  const [ticked, setTicked] = useState(NONE);
  const [moved, setMoved] = useState<number | null>(null);
  const available = items.filter((item) => !chosen.includes(item.id));
  const picked = items.filter((item) => chosen.includes(item.id));
  const tickedOn = (side: readonly { readonly id: string }[]) =>
    ticked.filter((key) => side.some((item) => item.id === key));
  const availableTitle = availableLabel ?? t(K.available);
  const chosenTitle = chosenLabel ?? t(K.chosen);

  const move = (keys: readonly string[], to: "chosen" | "available") => {
    const next = transferKeys(chosen, items, keys, to);
    if (value === undefined) setOwn(next);
    onChange?.(next);
    setTicked(ticked.filter((key) => !keys.includes(key)));
    setMoved(Math.abs(next.length - chosen.length));
  };
  const tick = (side: readonly { readonly id: string }[]) => (keys: readonly string[]) =>
    setTicked([...ticked.filter((key) => !side.some((item) => item.id === key)), ...keys]);

  return (
    <div data-slot="transfer-list" className={cn("@container grid gap-2", className)}>
      {label == null ? null : (
        <Label id={`${id}-label`} {...(isRequired ? { isRequired } : {})}>
          {label}
        </Label>
      )}
      <div
        role="group"
        {...(label == null ? {} : { "aria-labelledby": `${id}-label` })}
        className="grid grid-cols-1 items-center gap-3 @lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
      >
        <TransferListSide
          title={availableTitle}
          items={available}
          ticked={tickedOn(available)}
          onTick={tick(available)}
          onMoveAll={(keys) => move(keys, "chosen")}
          moveAllLabel={t(K.add_all)}
          filterLabel={t(K.filter, { list: availableTitle })}
          emptyLabel={t(K.empty)}
          isDisabled={isDisabled}
        />
        <div className="flex justify-center gap-2 @lg:flex-col">
          <IconButton
            icon="chevron-right"
            label={t(K.add)}
            variant="secondary"
            className={TURN}
            isDisabled={isDisabled || tickedOn(available).length === 0}
            onPress={() => move(tickedOn(available), "chosen")}
          />
          <IconButton
            icon="chevron-left"
            label={t(K.remove)}
            variant="secondary"
            className={TURN}
            isDisabled={isDisabled || tickedOn(picked).length === 0}
            onPress={() => move(tickedOn(picked), "available")}
          />
        </div>
        <TransferListSide
          title={chosenTitle}
          items={picked}
          ticked={tickedOn(picked)}
          onTick={tick(picked)}
          onMoveAll={(keys) => move(keys, "available")}
          moveAllLabel={t(K.remove_all)}
          filterLabel={t(K.filter, { list: chosenTitle })}
          emptyLabel={t(K.empty)}
          isDisabled={isDisabled}
        />
      </div>
      {description == null ? null : <Description>{description}</Description>}
      {isInvalid && errorMessage ? (
        <span className="text-xs text-danger">{errorMessage}</span>
      ) : null}
      <VisuallyHidden role="status">
        {moved === null ? "" : t(K.moved, { count: moved })}
      </VisuallyHidden>
      {name ? chosen.map((key) => <input key={key} type="hidden" name={name} value={key} />) : null}
    </div>
  );
}
