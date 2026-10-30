/**
 * Stackra file contract:
 * Purpose: the "cycle" demo of the native Skeleton: Reload shows the placeholder for a moment, then the content.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import {
  Avatar,
  Button,
  Card,
  Skeleton,
  SkeletonGroup,
  Text,
  useCatalogueText,
} from "@stackra/ui/native";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SKELETON_DEMO_KEYS } from "#src/demos/free/skeleton/skeleton-demo-keys.constant";

/** The demo's keys. */
const K = SKELETON_DEMO_KEYS.demo_free.skeleton.cycle;

/** The person in the row: a name and a handle, not translated copy. */
const PERSON = { name: "Ada Lovelace", handle: "@ada" } as const;

/** How long the profile loads, in milliseconds. */
const LOAD_MILLISECONDS = 1500;

/** Each bone wraps the content it stands in for. */
export default function Cycle() {
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
      <Card className="self-stretch">
        <SkeletonGroup
          isLoading={isLoading}
          loadingLabel={t(K.loading)}
          className="flex-row items-center gap-3"
        >
          <Skeleton className="size-12">
            <Avatar name="Ada Lovelace" size="lg" />
          </Skeleton>
          <View className="flex-1 gap-1">
            <Skeleton className="h-4 w-32">
              <Text>{PERSON.name}</Text>
            </Skeleton>
            <Skeleton className="h-3 w-16">
              <Text type="small" tone="muted">
                {PERSON.handle}
              </Text>
            </Skeleton>
          </View>
        </SkeletonGroup>
      </Card>
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
