/**
 * Stackra file contract:
 * Purpose: the "retry" demo of the web ErrorPage: offline at the register: Try again stays pending while the connection is checked, and the second attempt recovers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); GAPS.md row 31 (owner decision 2026-10-28).
 */
import { Button, ErrorPage, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_PAGE_KEYS } from "#src/demos/free/error-page/error-page-keys.constant";

/** The demo's keys. */
const K = ERROR_PAGE_KEYS.error_page;

/** How long a connection check takes, in milliseconds. */
const CHECK_MS = 1000;

/** Error page: Retry. */
export default function Retry() {
  const t = useCatalogueText(MESSAGES.en);
  const [attempts, setAttempts] = useState(0);
  const isOnline = attempts >= 2;
  return (
    <div role="group" aria-label={t(K.region_name)} className="grid gap-3 border border-separator">
      {isOnline ? (
        <div className="grid justify-items-start gap-3 p-6">
          <Text>{t(K.recovered)}</Text>
          <Button variant="secondary" onPress={() => setAttempts(0)}>
            {t(K.break_again)}
          </Button>
        </div>
      ) : (
        <ErrorPage
          preset="offline"
          headingLevel={3}
          onRetry={() =>
            new Promise<void>((resolve) => {
              setTimeout(resolve, CHECK_MS);
            }).then(() => setAttempts((count) => count + 1))
          }
        />
      )}
      <Text tone="muted" className="px-6 pb-4">
        {t(K.attempts, { count: attempts })}
      </Text>
    </div>
  );
}
