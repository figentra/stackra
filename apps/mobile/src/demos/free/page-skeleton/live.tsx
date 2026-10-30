/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native PageSkeleton: Reload shows the placeholders for a moment, then the content.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Card, PageSkeleton, Text, useCatalogueText } from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_SKELETON_DEMO_KEYS } from "#src/demos/free/page-skeleton/page-skeleton-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_SKELETON_DEMO_KEYS.demo_free.page_skeleton.live;

/** How long the page loads, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

/** The report loads, then shows. */
export default function Live() {
  const [isLoading, setIsLoading] = useState(true);
  const t = useCatalogueText(MESSAGES.en);

  // The timer is cleared on unmount and when the state changes, so a stale one never sets state afterwards.
  useEffect(() => {
    if (!isLoading) return undefined;
    const timer = setTimeout(() => setIsLoading(false), LOAD_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <View className="items-start gap-3">
      {isLoading ? (
        <PageSkeleton layout="section" loadingLabel={t(K.loading)} />
      ) : (
        <Card>
          <Card.Header>
            <Card.Title>{t(K.heading)}</Card.Title>
          </Card.Header>
          <Card.Content>
            <Text accessibilityLiveRegion="polite">{t(K.body)}</Text>
          </Card.Content>
        </Card>
      )}
      <Button
        size="sm"
        variant="secondary"
        isDisabled={isLoading}
        onPress={() => setIsLoading(true)}
      >
        {t(K.reload)}
      </Button>
    </View>
  );
}
