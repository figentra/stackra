/**
 * Stackra file contract:
 * Purpose: the "tones" demo of the web Link: Standalone links, one per tone: first with the underline on hover, then
 *          always underlined.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decisions 5 and 7); ADR 0060 (right-to-left).
 */
import { Enum, Tone } from "@stackra/contracts";
import { Heading, Link as UiLink, useCatalogueText } from "@stackra/ui/react";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { MESSAGES } from "#src/constants/messages.constant";
import { LINK_KEYS } from "#src/demos/free/link/link-keys.constant";

/** The demo's keys. */
const K = LINK_KEYS.link;

/** The list that lays samples out in a wrapping row. */
const ROW = "flex flex-wrap items-center gap-x-6 gap-y-2";

/** A titled list of one Link per tone. */
function ToneList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Heading level={3}>{title}</Heading>
      <ul className={ROW}>{children}</ul>
    </div>
  );
}

/** The Link demo: tones. */
export default function Tones() {
  const t = useCatalogueText(MESSAGES.en);
  const { pathname, search } = useLocation();

  // A same-page anchor that keeps the scheme and language, which a bare `#id` would drop.
  const here = `${pathname}${search}`;

  return (
    <div className="grid gap-6">
      <ToneList title={t(K.hover)}>
        {Enum.values(Tone).map((tone) => (
          <li key={tone}>
            <UiLink href={`${here}#link-tones`} tone={tone} underline="hover">
              {tone}
            </UiLink>
          </li>
        ))}
      </ToneList>
      <ToneList title={t(K.always)}>
        {Enum.values(Tone).map((tone) => (
          <li key={tone}>
            <UiLink href={`${here}#link-tones`} tone={tone} underline="always">
              {tone}
            </UiLink>
          </li>
        ))}
      </ToneList>
    </div>
  );
}
