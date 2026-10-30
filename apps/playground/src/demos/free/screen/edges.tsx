/**
 * Stackra file contract:
 * Purpose: the "edges" demo of the web Screen: Each sample keeps clear of the edges it is given, with padding taken
 *          from the device’s safe area or the desktop title bar. A desktop browser has none, so the gaps here are
 *          zero; an installed app or a phone shows them.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10,
 *          2.1.1 and 4.1.3.
 */
import type { ScreenEdge } from "@stackra/ui/contracts";
import { Screen as UiScreen, Surface, Text, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCREEN_KEYS } from "#src/demos/free/screen/screen-keys.constant";

/** The demo's keys. */
const K = SCREEN_KEYS.screen;

/** The box a screen sits in, tall enough to show a gap and to need scrolling. */
const BOX = "h-36 border border-border";

/** The grid that lays the samples out in one column of cards. */
const GRID = "grid gap-4";

/** A caption and the sample it describes, as one list item. */
function Sample({ caption, children }: { readonly caption: string; readonly children: ReactNode }) {
  return (
    <li className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      {children}
    </li>
  );
}

/** One embedded screen over a short card, kept clear of the edges it is given. */
function EdgesSample({
  caption,
  edges,
  sample,
}: {
  readonly caption: string;
  readonly edges: readonly ScreenEdge[];
  readonly sample: string;
}) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Sample caption={caption}>
      <UiScreen isEmbedded edges={edges} className={BOX} data-sample={sample}>
        <Surface className="m-3 p-3">
          <Text>{t(K.card)}</Text>
        </Surface>
      </UiScreen>
    </Sample>
  );
}

/** Screen: Edges. */
export default function Edges() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ul className={GRID}>
      <EdgesSample caption={t(K.all)} edges={["top", "bottom", "sides"]} sample="all" />
      <EdgesSample caption={t(K.top)} edges={["top"]} sample="top" />
      <EdgesSample caption={t(K.bottom)} edges={["bottom"]} sample="bottom" />
      <EdgesSample caption={t(K.sides)} edges={["sides"]} sample="sides" />
      <EdgesSample caption={t(K.none)} edges={[]} sample="none" />
    </ul>
  );
}
