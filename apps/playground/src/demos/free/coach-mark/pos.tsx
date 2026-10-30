/**
 * Stackra file contract:
 * Purpose: the "pos" demo of the web CoachMark: the first-shift tour of a POS register: scan, basket, take payment; the spotlight glides between them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 39 (owner decision 2026-10-28).
 */
import { Button, CoachMark, Text, useCatalogueText } from "@stackra/ui/react";
import { useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COACH_MARK_KEYS } from "#src/demos/free/coach-mark/coach-mark-keys.constant";

/** The demo's keys. */
const K = COACH_MARK_KEYS.coach_mark;

/** Coach mark: POS register. */
export default function Pos() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const scan = useRef<HTMLButtonElement>(null);
  const basket = useRef<HTMLDivElement>(null);
  const pay = useRef<HTMLButtonElement>(null);
  return (
    <div className="grid gap-4">
      <Button variant="secondary" className="justify-self-start" onPress={() => setOpen(true)}>
        {t(K.start)}
      </Button>
      <div className="grid grid-cols-[1fr_auto] items-start gap-4 border border-separator p-4">
        <Button ref={scan} variant="secondary">
          {t(K.pos.scan)}
        </Button>
        <Button ref={pay}>{t(K.pos.pay)}</Button>
        <div ref={basket} className="col-span-2 border border-dashed border-separator p-4">
          <Text tone="muted">{t(K.pos.basket)}</Text>
        </div>
      </div>
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
    </div>
  );
}
