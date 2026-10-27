/**
 * Stackra file contract:
 * Purpose: the web `KdsBoard`: kitchen tickets as cards, oldest first, each with its age coloured by the caller's
 *          steps, its rush, allergy and held flags, its lines (a line is a toggle that bumps it), and a Bump button;
 *          above them the all-day counts of the lines still to make and a Recall button.
 * Boundary: proposes, never saves: a bump, an item bump or a recall calls the caller, which changes the tickets. The
 *           board holds no timer (the caller ticks `now`) and no age step (a setting). A bump bar's keys reach the
 *           focused button as keystrokes; mapping a bar's keys to tickets is the screen's. A station board and the
 *           expo screen are this board over different tickets.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 1.4.1 (an age is a word, never a colour alone).
 */
import type { Tone } from "@stackra/ui/contracts";
import { Button, Chip } from "@stackra/ui/react";
import type { ReactElement } from "react";

import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { allDayCounts } from "#core/functions/all-day-counts.function";
import { kdsAgeTone } from "#core/functions/kds-age-tone.function";
import { useUiProText } from "#react/hooks/use-ui-pro-text";
import type { KdsBoardProps } from "#react/kds-board/kds-board.props";

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
    <div data-slot="kds-board" role="group" aria-label={label} className="flex flex-col gap-3">
      {showAllDay || onRecall !== undefined ? (
        <div className="flex flex-wrap items-center gap-2">
          {showAllDay ? (
            <section aria-label={t(keys.all_day)} className="flex flex-1 flex-wrap gap-2">
              {allDayCounts(tickets).map(([name, quantity]) => (
                <Chip key={name} size="sm">{`${quantity} × ${name}`}</Chip>
              ))}
            </section>
          ) : null}
          {onRecall === undefined ? null : (
            <Button size="sm" variant="secondary" onPress={onRecall}>
              {t(keys.recall)}
            </Button>
          )}
        </div>
      ) : null}
      <ol className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
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
            <li
              key={ticket.id}
              data-ticket={ticket.id}
              data-tone={tone}
              aria-label={`${ticket.title}, ${formatAge(minutes)}`}
              className={`flex flex-col gap-2 rounded-lg border-2 bg-surface p-2 ${BORDER[tone]} ${ticket.isHeld === true ? "opacity-60" : ""}`}
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{ticket.title}</p>
                  {ticket.subtitle === undefined ? null : (
                    <p className="truncate text-xs text-muted">{ticket.subtitle}</p>
                  )}
                </div>
                <Chip size="sm" tone={tone}>
                  {formatAge(minutes)}
                </Chip>
              </header>
              {flags.length === 0 ? null : (
                <div className="flex flex-wrap gap-1">
                  {flags.map((flag) => (
                    <Chip key={flag.key} size="sm" tone={flag.tone}>
                      {flag.text}
                    </Chip>
                  ))}
                </div>
              )}
              <ul className="flex flex-col gap-1">
                {ticket.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-item={item.id}
                      aria-pressed={item.isDone === true}
                      disabled={onItemBump === undefined}
                      className={`w-full text-start text-sm ${item.isDone === true ? "text-muted line-through" : ""} ${item.isHeld === true ? "opacity-60" : ""}`}
                      onClick={() => onItemBump?.(ticket.id, item.id)}
                    >
                      <span className="font-medium">{`${item.quantity} × ${item.name}`}</span>
                      {item.hasAllergy === true ? ` (${t(keys.allergy)})` : null}
                      {(item.notes ?? []).map((note) => (
                        <span key={note} className="block text-xs text-muted">
                          {note}
                        </span>
                      ))}
                    </button>
                  </li>
                ))}
              </ul>
              {onBump === undefined ? null : (
                <Button size="sm" variant="primary" isFullWidth onPress={() => onBump(ticket.id)}>
                  {t(keys.bump)}
                </Button>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
