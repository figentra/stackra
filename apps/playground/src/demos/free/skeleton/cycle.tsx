/**
 * Stackra file contract:
 * Purpose: the "cycle" demo of the web Skeleton: Reload the profile: the placeholder shows for a moment, then the
 *          content is back.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import {
  Avatar,
  Button,
  Skeleton as UiSkeleton,
  SkeletonGroup,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SKELETON_KEYS } from "#src/demos/free/skeleton/skeleton-keys.constant";

/** The demo's keys. */
const K = SKELETON_KEYS.skeleton;

/** How long the profile card stays a placeholder after a reload, in milliseconds. */
const RELOAD_MS = 1500;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** Skeleton: Loading to content. */
export default function Cycle() {
  const t = useCatalogueText(MESSAGES.en);
  const [isLoading, setIsLoading] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The timer is cleared on unmount, so a page left mid-reload never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  const reload = () => {
    setIsLoading(true);
    timer.current = setTimeout(() => setIsLoading(false), RELOAD_MS);
  };

  return (
    <div className={ROW}>
      <SkeletonGroup
        isLoading={isLoading}
        loadingLabel={t(K.loading_profile)}
        className="flex w-72 items-center gap-3"
        data-sample="profile"
      >
        <UiSkeleton className="size-10 shrink-0">
          <Avatar name={t(K.name)} />
        </UiSkeleton>
        <div className="grid flex-1 gap-2">
          <UiSkeleton className="h-4 w-40">
            <Text>{t(K.name)}</Text>
          </UiSkeleton>
          <UiSkeleton className="h-3 w-24">
            <Text tone="muted" type="small">
              {t(K.handle)}
            </Text>
          </UiSkeleton>
        </div>
      </SkeletonGroup>
      <Button variant="secondary" isLoading={isLoading} onPress={reload}>
        {t(K.reload)}
      </Button>
    </div>
  );
}
