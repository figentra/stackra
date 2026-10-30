/**
 * Stackra file contract:
 * Purpose: the "outcome" demo of the native CoachMark: an uncontrolled tour that reports whether it was finished or skipped, so the app can stop showing it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 39 (owner decision 2026-10-28).
 */
import type { CoachMarkOutcome } from "@stackra/ui/contracts";
import { Button, CoachMark, Text, useCatalogueText } from "@stackra/ui/native";
import { useRef, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COACH_MARK_DEMO_KEYS } from "#src/demos/free/coach-mark/coach-mark-demo-keys.constant";

/** The demo's keys. */
const K = COACH_MARK_DEMO_KEYS.demo_free.coach_mark;

/** Finish or skip the tour; the outcome shows below. */
export default function Outcome() {
  const t = useCatalogueText(MESSAGES.en);
  const [outcome, setOutcome] = useState<CoachMarkOutcome | undefined>(undefined);
  const [run, setRun] = useState(0);
  const scan = useRef<View>(null);
  const pay = useRef<View>(null);
  return (
    <View className="items-start gap-3">
      <Button
        size="sm"
        variant="secondary"
        onPress={() => {
          setOutcome(undefined);
          setRun((count) => count + 1);
        }}
      >
        {t(K.start)}
      </Button>
      <View className="flex-row gap-3">
        <View ref={scan} collapsable={false}>
          <Button size="sm" variant="secondary">
            {t(K.pos.scan)}
          </Button>
        </View>
        <View ref={pay} collapsable={false}>
          <Button size="sm">{t(K.pos.pay)}</Button>
        </View>
      </View>
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
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t(outcome === "done" ? K.outcome_done : K.outcome_skipped)}
        </Text>
      )}
    </View>
  );
}
