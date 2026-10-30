/**
 * Stackra file contract:
 * Purpose: `LiveDemo`, one demo file mounted live: lazy-loaded, a skeleton while it loads, the catalogue's error line
 *          when it throws, and the planned note when the demo file does not exist yet. A demo loaded once (or preloaded by `preloadDemo`) mounts at once afterwards, so a page revisit or a platform switch never
 *          flashes the skeleton and collapses the page.
 * Boundary: mounting only; the pane, toggles and code are `ExamplePreview`'s. Used again by the Stackra section's RTL
 *           and brand frames.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 4 and 5.
 */
import { Skeleton, Text, useCatalogueText } from "@stackra/ui/react";
import { Suspense } from "react";

import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import { DemoBoundary } from "#src/components/component-page/demo-boundary";
import { demoOf } from "#src/components/component-page/demo-of.function";
import type { LiveDemoProps } from "#src/components/component-page/live-demo.props";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase.ui;

/** The demo at `path`, live. */
export function LiveDemo({ path }: LiveDemoProps) {
  const t = useCatalogueText(MESSAGES.en);
  const Demo = demoOf(path);
  if (!Demo)
    return (
      <Text tone="muted">
        <bdi>{t(K.planned_note)}</bdi>
      </Text>
    );
  return (
    <DemoBoundary fallback={<Text tone="danger">{t(K.preview_error)}</Text>}>
      <Suspense
        fallback={
          // The e2e scans wait for this mark to leave: a demo mounting mid-scan changes the headings axe is ordering.
          <Skeleton isLoading data-demo-loading="">
            {/* Full width and stage-high, so the demo replaces it with little or no shift. */}
            <div className="h-48 w-full min-w-48" />
          </Skeleton>
        }
      >
        {/* oxlint-disable-next-line react/static-components -- reason: demoOf returns one component per demo file, made once at module level, not on every render */}
        <Demo />
      </Suspense>
    </DemoBoundary>
  );
}
