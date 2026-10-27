/**
 * Stackra file contract:
 * Purpose: the native `KdsBoard`: kitchen tickets as cards, oldest first, each with its age coloured by the caller's
 *          steps, its rush, allergy and held flags, its lines (a line is a checkbox that bumps it), and a Bump button;
 *          above them the all-day counts of the lines still to make and a Recall button. The web board's contract, on
 *          React Native, for Android KDS screens and iPads.
 * Boundary: proposes, never saves: a bump, an item bump or a recall calls the caller, which changes the tickets. The
 *           board holds no timer (the caller ticks `now`) and no age step (a setting). A bump bar is a peripheral the
 *           screen maps to `onBump`; scrolling a long board is the screen's.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1 (an age is a word, never a colour alone).
 */
import type { Tone } from "@stackra/ui/contracts";
import { Button, Chip, Text } from "@stackra/ui/native";
import type { ReactElement } from "react";
import { Pressable, View } from "react-native";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { allDayCounts } from "#core/functions/all-day-counts.function";
import { kdsAgeTone } from "#core/functions/kds-age-tone.function";
import { useUiProText } from "#native/hooks/use-ui-pro-text";
import type { KdsBoardProps } from "#native/kds-board/kds-board.props";

/** The border each age tone draws a ticket with. */
const BORDER: Readonly<Record<Tone, string>> = Object.freeze({
  default: "border-separator",
  accent: "border-accent",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
});

/** A kitchen ticket board. */
export function KdsBoard({
  label,
  tickets,
  now,
  ageTones,
  formatAge,
  showAllDay = false,
  onBump,
  onItemBump,
  onRecall,
}: KdsBoardProps): ReactElement {
  const t = useUiProText();
  const keys = UI_PRO_KEYS.ui_pro.kds;

  return (
    <View testID="kds-board" accessibilityLabel={label} className="gap-3">
      {showAllDay || onRecall !== undefined ? (
        <View className="flex-row flex-wrap items-center gap-2">
          {showAllDay ? (
            <View
              testID="kds-all-day"
              accessibilityLabel={t(keys.all_day)}
              className="flex-1 flex-row flex-wrap gap-2"
            >
              {allDayCounts(tickets).map(([name, quantity]) => (
                <Chip key={name} size="sm">{`${quantity} × ${name}`}</Chip>
              ))}
            </View>
          ) : null}
          {onRecall === undefined ? null : (
            <Button size="sm" variant="secondary" onPress={onRecall}>
              {t(keys.recall)}
            </Button>
          )}
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-3">
        {tickets.map((ticket) => {
          const minutes = Math.max(0, Math.floor((now - ticket.sentAt) / 60_000));
          const tone = kdsAgeTone(minutes, ageTones);
          const flags = [
            ticket.isRush === true
              ? { key: "rush", text: t(keys.rush), tone: "danger" as const }
              : undefined,
            ticket.hasAllergy === true
              ? { key: "allergy", text: t(keys.allergy), tone: "warning" as const }
              : undefined,
            ticket.isHeld === true
              ? { key: "held", text: t(keys.held), tone: "default" as const }
              : undefined,
          ].filter((flag) => flag !== undefined);
          return (
            <View
              key={ticket.id}
              testID={`ticket-${ticket.id}`}
              accessibilityLabel={`${ticket.title}, ${formatAge(minutes)}`}
              className={`w-56 gap-2 rounded-lg border-2 bg-surface p-2 ${BORDER[tone]} ${ticket.isHeld === true ? "opacity-60" : ""}`}
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text isTruncated className="font-semibold">
                    {ticket.title}
                  </Text>
                  {ticket.subtitle === undefined ? null : (
                    <Text type="caption" tone="muted" isTruncated>
                      {ticket.subtitle}
                    </Text>
                  )}
                </View>
                <Chip size="sm" tone={tone}>
                  {formatAge(minutes)}
                </Chip>
              </View>
              {flags.length === 0 ? null : (
                <View className="flex-row flex-wrap gap-1">
                  {flags.map((flag) => (
                    <Chip key={flag.key} size="sm" tone={flag.tone}>
                      {flag.text}
                    </Chip>
                  ))}
                </View>
              )}
              <View className="gap-1">
                {ticket.items.map((item) => (
                  <Pressable
                    key={item.id}
                    testID={`ticket-item-${item.id}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{
                      checked: item.isDone === true,
                      disabled: onItemBump === undefined,
                    }}
                    disabled={onItemBump === undefined}
                    onPress={() => onItemBump?.(ticket.id, item.id)}
                    className={item.isHeld === true ? "opacity-60" : ""}
                  >
                    <Text
                      type="small"
                      tone={item.isDone === true ? "muted" : "default"}
                      className={`font-medium ${item.isDone === true ? "line-through" : ""}`}
                    >
                      {`${item.quantity} × ${item.name}${item.hasAllergy === true ? ` (${t(keys.allergy)})` : ""}`}
                    </Text>
                    {(item.notes ?? []).map((note) => (
                      <Text key={note} type="caption" tone="muted">
                        {note}
                      </Text>
                    ))}
                  </Pressable>
                ))}
              </View>
              {onBump === undefined ? null : (
                <Button size="sm" variant="primary" isFullWidth onPress={() => onBump(ticket.id)}>
                  {t(keys.bump)}
                </Button>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
