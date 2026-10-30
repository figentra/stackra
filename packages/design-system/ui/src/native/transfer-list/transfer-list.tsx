/**
 * Stackra file contract:
 * Purpose: the native `TransferList`: a labelled field of two lists stacked, the available items above the chosen ones,
 *          each with a count, a filter, ticks and a "move all" for what the filter shows, and between them a row of two
 *          buttons that move the ticked items down into the chosen list or back up. Each move is announced.
 * Boundary: composes the house Listbox, SearchField, Button and Text; a phone has no room for two lists side by side,
 *           so the lists stack and the buttons say what they do in words. The value is the chosen keys in the order of
 *           `items`. A native field has no form to submit under `name`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0055 (one field contract); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import { useState, type ReactElement } from "react";
import { AccessibilityInfo, View } from "react-native";

import { OVERLAY_SELECTION_KEYS } from "#core/constants/overlay-selection-keys.constant";
import { transferKeys } from "#core/functions/transfer-keys.function";
import { Button } from "#native/button/button";
import { Text } from "#native/text/text";
import { TransferListSide } from "#native/transfer-list/transfer-list-side";
import type { TransferListProps } from "#native/transfer-list/transfer-list.props";
import { useUiText } from "#react/hooks/use-ui-text";

/** The transfer list's words. */
const K = OVERLAY_SELECTION_KEYS.ui.transfer_list;

/** Nothing chosen or ticked yet. */
const NONE: readonly string[] = [];

/** Two stacked lists to move items between. */
export function TransferList({
  items,
  label,
  description,
  errorMessage,
  isInvalid,
  isDisabled = false,
  availableLabel,
  chosenLabel,
  value,
  defaultValue,
  onChange,
  name: _name,
  className,
}: TransferListProps): ReactElement {
  const t = useUiText();
  const [own, setOwn] = useState(defaultValue ?? NONE);
  const chosen = value ?? own;
  const [ticked, setTicked] = useState(NONE);
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
    AccessibilityInfo.announceForAccessibility(
      t(K.moved, { count: Math.abs(next.length - chosen.length) }),
    );
  };
  const tick = (side: readonly { readonly id: string }[]) => (keys: readonly string[]) =>
    setTicked([...ticked.filter((key) => !side.some((item) => item.id === key)), ...keys]);

  return (
    <View className={`gap-3 ${className ?? ""}`}>
      {label == null ? null : <Text className="font-medium">{label}</Text>}
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
      <View className="flex-row gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          isDisabled={isDisabled || tickedOn(available).length === 0}
          onPress={() => move(tickedOn(available), "chosen")}
        >
          {t(K.add)}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          isDisabled={isDisabled || tickedOn(picked).length === 0}
          onPress={() => move(tickedOn(picked), "available")}
        >
          {t(K.remove)}
        </Button>
      </View>
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
      {description == null ? null : (
        <Text type="small" tone="muted">
          {description}
        </Text>
      )}
      {isInvalid && errorMessage ? (
        <Text type="small" tone="danger">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
