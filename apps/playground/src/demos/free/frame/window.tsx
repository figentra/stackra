/**
 * Stackra file contract:
 * Purpose: the "window" demo of the web Frame: a billing console's invoice list inside a window frame titled with
 *          its address, as a landing page shows a screenshot.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-2041.
 */
import { Chip, Frame, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { FRAME_KEYS } from "#src/demos/free/frame/frame-keys.constant";

/** The demo's keys. */
const K = FRAME_KEYS.frame;

/** Three invoices (numbers are data, never translated). */
const INVOICES = [
  { number: "INV-1042", plan: K.growth, isPaid: true },
  { number: "INV-1043", plan: K.starter, isPaid: false },
  { number: "INV-1044", plan: K.scale, isPaid: true },
] as const;

/** Frame: a window around a console screen. */
export default function Window() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Frame title="console.figentra.com/billing/invoices" className="w-full max-w-md">
      <div className="grid gap-2 p-4">
        <Text className="font-semibold">{t(K.invoices)}</Text>
        <ul className="m-0 grid list-none divide-y divide-border p-0">
          {INVOICES.map((invoice) => (
            <li key={invoice.number} className="flex items-center gap-3 py-2">
              <Text elementType="span" dir="ltr" className="font-mono">
                {invoice.number}
              </Text>
              <Text elementType="span" tone="muted" className="flex-1" isTruncated>
                {t(invoice.plan)}
              </Text>
              <Chip size="sm" variant="soft" tone={invoice.isPaid ? "success" : "warning"}>
                {t(invoice.isPaid ? K.paid : K.due)}
              </Chip>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  );
}
