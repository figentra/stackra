/**
 * Stackra file contract:
 * Purpose: the "compact" demo of the web Number value: large figures in compact form, in dirhams and dinars.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { MoneyValue, NumberValue, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_VALUE_KEYS } from "#src/demos/free/number-value/number-value-keys.constant";

/** The demo's keys. */
const K = NUMBER_VALUE_KEYS.number_value.compact;

/** Number value: large figures in compact form, in dirhams and dinars. */
export default function Compact() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-2">
      <p className="m-0 text-sm text-muted">{t(K.note)}</p>
      <div className="flex flex-wrap gap-6 text-lg font-semibold">
        <MoneyValue amount={2_450_000} currency="AED" isCompact />
        <NumberValue value={1_250_000} options={{ notation: "compact" }} />
        <MoneyValue amount={89.5} currency="KWD" currencyDisplay="code" />
      </div>
    </div>
  );
}
