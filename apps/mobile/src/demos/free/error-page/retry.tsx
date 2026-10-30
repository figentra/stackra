/**
 * Stackra file contract:
 * Purpose: the "retry" demo of the native ErrorPage: offline at the register: Try again stays pending while the connection is checked; the second attempt recovers.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); GAPS.md
 *          row 31 (owner decision 2026-10-28).
 */
import { Button, ErrorPage, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ERROR_PAGE_DEMO_KEYS } from "#src/demos/free/error-page/error-page-demo-keys.constant";

/** The demo's keys. */
const K = ERROR_PAGE_DEMO_KEYS.demo_free.error_page.retry;

/** How long a connection check takes, in milliseconds. */
const CHECK_MS = 1000;

/** Retry until the connection is back. */
export default function Retry() {
  const t = useCatalogueText(MESSAGES.en);
  const [attempts, setAttempts] = useState(0);
  return (
    <View className="items-start gap-3">
      {attempts >= 2 ? (
        <>
          <Text accessibilityLiveRegion="polite">{t(K.recovered)}</Text>
          <Button size="sm" variant="secondary" onPress={() => setAttempts(0)}>
            {t(K.break_again)}
          </Button>
        </>
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
      <Text tone="muted">{t(K.attempts, { count: attempts })}</Text>
    </View>
  );
}
