/**
 * Stackra file contract:
 * Purpose: the "paid" demo of the web Result: the end of a checkout: paid, with the receipt as the next step.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { Button, Result, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RESULT_KEYS } from "#src/demos/free/result/result-keys.constant";

/** The demo's keys. */
const K = RESULT_KEYS.result.paid;

/** Result: the end of a checkout: paid, with the receipt as the next step. */
export default function Paid() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Result
      status="success"
      title={t(K.title)}
      description={t(K.description)}
      actions={
        <>
          <Button>{t(K.receipt)}</Button>
          <Button variant="secondary">{t(K.back)}</Button>
        </>
      }
    />
  );
}
