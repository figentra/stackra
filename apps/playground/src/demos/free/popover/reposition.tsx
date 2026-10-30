/**
 * Stackra file contract:
 * Purpose: the "reposition" demo of the web Popover: content that grows ("Show more") stays anchored on its own, and a
 *          trigger that moves without changing size ("Move the trigger") is re-anchored with `usePopoverPosition`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (popover updatePosition);
 *          ADR 0060 (light, dark, RTL).
 */
import {
  Button,
  Popover as UiPopover,
  Text,
  useCatalogueText,
  usePopoverPosition,
} from "@stackra/ui/react";
import { useEffect, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { POPOVER_KEYS } from "#src/demos/free/popover/popover-keys.constant";

/** The demo's keys. */
const K = POPOVER_KEYS.popover;

/** The popover measures again when its content grows or its trigger moves. */
export default function Reposition() {
  const t = useCatalogueText(MESSAGES.en);
  const { updatePosition } = usePopoverPosition();
  const [lines, setLines] = useState(1);
  const [isMoved, setIsMoved] = useState(false);

  // The trigger moved but kept its size, which React Aria does not watch: ask the popover to measure again.
  // oxlint-disable-next-line react/exhaustive-effect-dependencies -- the move is the trigger: the effect runs after the render that moved it
  useEffect(() => updatePosition(), [isMoved, updatePosition]);

  return (
    <div className="flex min-h-48 items-center justify-center">
      <div className={isMoved ? "ms-32" : "ms-0"}>
        <UiPopover
          title={t(K.reposition_title)}
          placement="top"
          className="max-w-72"
          trigger={<Button variant="secondary">{t(K.reposition_trigger)}</Button>}
        >
          <div className="grid gap-3">
            {Array.from({ length: lines }, (_, index) => (
              <Text key={index}>
                <bdi>{t(K.reposition_line, { n: index + 1 })}</bdi>
              </Text>
            ))}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onPress={() => setLines(lines + 1)}>
                {t(K.reposition_more)}
              </Button>
              <Button size="sm" variant="tertiary" onPress={() => setIsMoved(!isMoved)}>
                {t(K.reposition_move)}
              </Button>
            </div>
          </div>
        </UiPopover>
      </div>
    </div>
  );
}
