/**
 * Stackra file contract:
 * Purpose: the "table" demo of the web Status badge: The status column of a list of records.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0304; WCAG 2.2 SC 1.4.1 (use of colour); ADR 0060 (light, dark, RTL).
 */
import type { Tone } from "@stackra/contracts";
import { StatusBadge as UiStatusBadge, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { STATUS_BADGE_KEYS } from "#src/demos/free/status-badge/status-badge-keys.constant";

/** The demo's keys. */
const K = STATUS_BADGE_KEYS.status_badge;

/** A realistic state for each tone. */
const STATE = {
  default: "Draft",
  accent: "Scheduled",
  success: "Active",
  warning: "Pending",
  danger: "Failed",
} as const satisfies Record<Tone, string>;

/** The orders of the table sample: a name and the tone of its state. */
const ORDERS = [
  { name: "Order 1040", tone: "success" },
  { name: "Order 1041", tone: "warning" },
  { name: "Order 1042", tone: "danger" },
  { name: "Order 1043", tone: "default" },
] as const;

/** Status badge: In a table. */
export default function Table() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <table className="w-full max-w-md text-start">
      <caption className="sr-only">{t(K.caption)}</caption>
      <thead>
        <tr>
          <th scope="col" className="p-2 text-start text-sm font-semibold">
            {t(K.order)}
          </th>
          <th scope="col" className="p-2 text-start text-sm font-semibold">
            {t(K.status)}
          </th>
        </tr>
      </thead>
      <tbody>
        {ORDERS.map((order) => (
          <tr key={order.name}>
            <th scope="row" className="p-2 text-start text-sm font-normal">
              <bdi>{order.name}</bdi>
            </th>
            <td className="p-2">
              <UiStatusBadge tone={order.tone}>{STATE[order.tone]}</UiStatusBadge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
