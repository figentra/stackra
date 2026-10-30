/**
 * Stackra file contract:
 * Purpose: the "outcome" demo of the web CoachMark: an uncontrolled tour that reports whether it was finished or skipped, so the app can stop showing it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 39 (owner decision 2026-10-28).
 */
import type { CoachMarkOutcome } from "@stackra/ui/contracts";
import { Button, CoachMark, Text, useCatalogueText } from "@stackra/ui/react";
import { useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COACH_MARK_KEYS } from "#src/demos/free/coach-mark/coach-mark-keys.constant";

/** The demo's keys. */
const K = COACH_MARK_KEYS.coach_mark;

/** Coach mark: Done or skipped. */
export default function Outcome() {
  const t = useCatalogueText(MESSAGES.en);
  const [outcome, setOutcome] = useState<CoachMarkOutcome | undefined>(undefined);
  const [run, setRun] = useState(0);
  const scan = useRef<HTMLButtonElement>(null);
  const pay = useRef<HTMLButtonElement>(null);
  return (
    <div className="grid justify-items-start gap-4">
      <Button
        variant="secondary"
        onPress={() => {
          setOutcome(undefined);
          setRun((count) => count + 1);
        }}
      >
        {t(K.start)}
      </Button>
      <div className="flex flex-wrap gap-3">
        <Button ref={scan} variant="secondary">
          {t(K.pos.scan)}
        </Button>
        <Button ref={pay}>{t(K.pos.pay)}</Button>
      </div>
      {run === 0 ? null : (
        <CoachMark
          key={run}
          defaultOpen
          onFinish={setOutcome}
          steps={[
            {
              id: "scan",
              target: scan,
              title: t(K.pos.scan_title),
              description: t(K.pos.scan_text),
            },
            { id: "pay", target: pay, title: t(K.pos.pay_title), description: t(K.pos.pay_text) },
          ]}
        />
      )}
      {outcome === undefined ? null : (
        <Text tone="muted" aria-live="polite">
          {t(outcome === "done" ? K.outcome_done : K.outcome_skipped)}
        </Text>
      )}
    </div>
  );
}
