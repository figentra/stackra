/**
 * Stackra file contract:
 * Purpose: the "pos" demo of the native CoachMark: the first-shift tour of a POS register: scan, basket, take payment; the cutout glides between them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 39 (owner decision 2026-10-28).
 */
import { Button, CoachMark, Text, useCatalogueText } from "@stackra/ui/native";
import { useRef, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COACH_MARK_DEMO_KEYS } from "#src/demos/free/coach-mark/coach-mark-demo-keys.constant";

/** The demo's keys. */
const K = COACH_MARK_DEMO_KEYS.demo_free.coach_mark;

/** A three-step tour of a register. */
export default function Pos() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const scan = useRef<View>(null);
  const basket = useRef<View>(null);
  const pay = useRef<View>(null);
  return (
    <View className="gap-3">
      <Button size="sm" variant="secondary" className="self-start" onPress={() => setOpen(true)}>
        {t(K.start)}
      </Button>
      <View className="gap-3 border border-separator p-3">
        <View className="flex-row justify-between gap-3">
          <View ref={scan} collapsable={false}>
            <Button size="sm" variant="secondary">
              {t(K.pos.scan)}
            </Button>
          </View>
          <View ref={pay} collapsable={false}>
            <Button size="sm">{t(K.pos.pay)}</Button>
          </View>
        </View>
        <View
          ref={basket}
          collapsable={false}
          className="border border-dashed border-separator p-4"
        >
          <Text tone="muted">{t(K.pos.basket)}</Text>
        </View>
      </View>
      <CoachMark
        isOpen={isOpen}
        onOpenChange={setOpen}
        steps={[
          { id: "scan", target: scan, title: t(K.pos.scan_title), description: t(K.pos.scan_text) },
          {
            id: "basket",
            target: basket,
            title: t(K.pos.basket_title),
            description: t(K.pos.basket_text),
          },
          { id: "pay", target: pay, title: t(K.pos.pay_title), description: t(K.pos.pay_text) },
        ]}
      />
    </View>
  );
}
