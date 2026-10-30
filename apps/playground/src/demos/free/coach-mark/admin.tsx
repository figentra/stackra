/**
 * Stackra file contract:
 * Purpose: the "admin" demo of the web CoachMark: a tour of the admin's navigation; in Arabic the beacon sits on the inline-end corner, which is the left.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 39 (owner decision 2026-10-28).
 */
import { Button, CoachMark, useCatalogueText } from "@stackra/ui/react";
import { useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { COACH_MARK_KEYS } from "#src/demos/free/coach-mark/coach-mark-keys.constant";

/** The demo's keys. */
const K = COACH_MARK_KEYS.coach_mark;

/** Coach mark: Admin navigation. */
export default function Admin() {
  const t = useCatalogueText(MESSAGES.en);
  const [isOpen, setOpen] = useState(false);
  const orders = useRef<HTMLLIElement>(null);
  const products = useRef<HTMLLIElement>(null);
  const reports = useRef<HTMLLIElement>(null);
  return (
    <div className="grid gap-4">
      <Button variant="secondary" className="justify-self-start" onPress={() => setOpen(true)}>
        {t(K.start)}
      </Button>
      <nav aria-label={t(K.admin.navigation)} className="w-56 border border-separator p-2">
        <ul className="grid gap-1">
          <li ref={orders} className="px-3 py-2">
            {t(K.admin.orders)}
          </li>
          <li ref={products} className="px-3 py-2">
            {t(K.admin.products)}
          </li>
          <li ref={reports} className="px-3 py-2">
            {t(K.admin.reports)}
          </li>
        </ul>
      </nav>
      <CoachMark
        isOpen={isOpen}
        onOpenChange={setOpen}
        steps={[
          {
            id: "orders",
            target: orders,
            title: t(K.admin.orders_title),
            description: t(K.admin.orders_text),
          },
          {
            id: "products",
            target: products,
            title: t(K.admin.products_title),
            description: t(K.admin.products_text),
          },
          {
            id: "reports",
            target: reports,
            title: t(K.admin.reports_title),
            description: t(K.admin.reports_text),
          },
        ]}
      />
    </div>
  );
}
