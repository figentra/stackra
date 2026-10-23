/**
 * Stackra file contract:
 * Purpose: the page of the skeleton route: every animation, the common placeholder shapes, a group with one sweep
 *          beside three lone bones, and a profile card that cycles from placeholder to content, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0303 (decision 7); ADR 0304; ADR 0060 (light, dark, RTL).
 */
import { SkeletonAnimation } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";
import { useEffect, useRef, useState } from "react";

import { PageSection } from "#src/components/page-section";
import { SkeletonRoute } from "#src/routes/skeleton/skeleton.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::skeleton.*` keys.
const STRINGS = {
  documentTitle: `${SkeletonRoute.title} · Stackra Playground`,
  intro:
    "A Skeleton is a placeholder for content that is still loading. Its shape and size are its class. A lone bone is an empty box that screen readers never reach; a group names the loading region.",
  animations: "Animations",
  animationsNote: "A card per animation: a shimmering sweep, a slow pulse and a still placeholder.",
  shapes: "Shapes",
  shapesNote:
    "Shape and size come from the class alone: lines, an avatar, a media block and a button.",
  sweep: "One sweep",
  sweepNote: "A group draws one sweep over all its tiles; three lone bones each draw their own.",
  grouped: "Group",
  lone: "Lone",
  cycle: "Loading to content",
  cycleNote: "Reload the profile: the placeholder shows for a moment, then the content is back.",
  loadingProfile: "Loading profile",
  reload: "Reload",
  name: "Ada Lovelace",
  handle: "@ada",
} as const;

/** How long the profile card stays a placeholder after a reload, in milliseconds. */
const RELOAD_MS = 1500;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-6";

/** The Skeleton page. */
export function Skeleton() {
  const [isLoading, setIsLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The timer is cleared on unmount, so a page left mid-reload never sets state afterwards.
  useEffect(() => () => clearTimeout(timer.current), []);

  const reload = () => {
    setIsLoading(true);
    timer.current = setTimeout(() => setIsLoading(false), RELOAD_MS);
  };

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Ui.Heading level={1}>{SkeletonRoute.title}</Ui.Heading>
        <Ui.Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Ui.Text>
      </header>

      <PageSection
        id="skeleton-animations"
        title={STRINGS.animations}
        note={STRINGS.animationsNote}
      >
        <div className={ROW}>
          {SkeletonAnimation.map((animationType) => (
            <div key={animationType} data-animation={animationType} className="grid w-56 gap-3">
              <Ui.Skeleton animationType={animationType} className="h-24 rounded-lg" />
              <Ui.Skeleton animationType={animationType} className="h-3 w-full rounded" />
              <Ui.Skeleton animationType={animationType} className="h-3 w-4/5 rounded" />
              <Ui.Skeleton animationType={animationType} className="h-3 w-2/5 rounded" />
              <Ui.Text tone="muted" type="small">
                {animationType}
              </Ui.Text>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection id="skeleton-shapes" title={STRINGS.shapes} note={STRINGS.shapesNote}>
        <div className={ROW}>
          <div className="grid w-56 gap-2">
            <Ui.Skeleton className="h-3 w-full rounded" />
            <Ui.Skeleton className="h-3 w-4/5 rounded" />
            <Ui.Skeleton className="h-3 w-2/5 rounded" />
          </div>
          <Ui.Skeleton className="size-10 rounded-full" />
          <Ui.Skeleton className="h-32 w-56 rounded-lg" />
          <Ui.Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </PageSection>

      <PageSection id="skeleton-sweep" title={STRINGS.sweep} note={STRINGS.sweepNote}>
        <div className={ROW}>
          <div className="grid gap-2">
            <Ui.Text tone="muted" type="small">
              {STRINGS.grouped}
            </Ui.Text>
            <Ui.SkeletonGroup className="grid w-72 grid-cols-3 gap-3" data-sample="group">
              <Ui.Skeleton className="h-16 rounded-lg" />
              <Ui.Skeleton className="h-16 rounded-lg" />
              <Ui.Skeleton className="h-16 rounded-lg" />
            </Ui.SkeletonGroup>
          </div>
          <div className="grid gap-2">
            <Ui.Text tone="muted" type="small">
              {STRINGS.lone}
            </Ui.Text>
            <div className="grid w-72 grid-cols-3 gap-3" data-sample="lone">
              <Ui.Skeleton className="h-16 rounded-lg" />
              <Ui.Skeleton className="h-16 rounded-lg" />
              <Ui.Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection id="skeleton-cycle" title={STRINGS.cycle} note={STRINGS.cycleNote}>
        <div className={ROW}>
          <Ui.SkeletonGroup
            isLoading={isLoading}
            loadingLabel={STRINGS.loadingProfile}
            className="flex w-72 items-center gap-3"
            data-sample="profile"
          >
            <Ui.Skeleton className="size-10 shrink-0 rounded-full">
              <Ui.Avatar name={STRINGS.name} />
            </Ui.Skeleton>
            <div className="grid flex-1 gap-2">
              <Ui.Skeleton className="h-4 w-40 rounded">
                <Ui.Text>{STRINGS.name}</Ui.Text>
              </Ui.Skeleton>
              <Ui.Skeleton className="h-3 w-24 rounded">
                <Ui.Text tone="muted" type="small">
                  {STRINGS.handle}
                </Ui.Text>
              </Ui.Skeleton>
            </div>
          </Ui.SkeletonGroup>
          <Ui.Button variant="secondary" isLoading={isLoading} onPress={reload}>
            {STRINGS.reload}
          </Ui.Button>
        </div>
      </PageSection>
    </article>
  );
}
