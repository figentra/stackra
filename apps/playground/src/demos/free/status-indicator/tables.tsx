/**
 * Stackra file contract:
 * Purpose: the "tables" demo of the web StatusIndicator: a dining-room table list where each table's state reads by
 *          shape as well as colour; the table waiting too long pulses.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 30; ADR 0060
 *          (light, dark, RTL).
 */
import { StatusIndicator, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_INDICATOR_KEYS } from "#src/demos/free/status-indicator/status-indicator-keys.constant";

/** The demo's keys. */
const K = STATUS_INDICATOR_KEYS.status_indicator;

/** The tables: number, state and tone. */
const TABLES = [
  { n: 1, state: K.free, tone: "success", isAttention: false },
  { n: 2, state: K.seated, tone: "accent", isAttention: false },
  { n: 3, state: K.bill, tone: "warning", isAttention: false },
  { n: 4, state: K.overdue, tone: "danger", isAttention: true },
  { n: 5, state: K.cleaning, tone: "default", isAttention: false },
] as const;

/** Status indicator: Floor tables. */
export default function Tables() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <table className="w-full max-w-md text-start">
      <caption className="sr-only">{t(K.caption)}</caption>
      <tbody>
        {TABLES.map((table) => (
          <tr key={table.n} className="border-b border-border">
            <th scope="row" className="p-2 text-start text-sm font-normal">
              {t(K.table, { n: table.n })}
            </th>
            <td className="p-2">
              <StatusIndicator tone={table.tone} isAttention={table.isAttention}>
                {t(table.state)}
              </StatusIndicator>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
