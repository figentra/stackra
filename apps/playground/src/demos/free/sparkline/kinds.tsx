/**
 * Stackra file contract:
 * Purpose: the "kinds" demo of the web Sparkline: the same twelve weeks as a line, an area and bars, each a word-sized trend.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371.
 */
import { Sparkline, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SPARKLINE_KEYS } from "#src/demos/free/sparkline/sparkline-keys.constant";

/** The demo's keys. */
const K = SPARKLINE_KEYS.sparkline;

/** Twelve weeks of revenue, in thousands. */
const WEEKS = [12, 14, 13, 17, 16, 19, 18, 22, 21, 24, 23, 27];

/** The Sparkline demo: kinds. */
export default function Kinds() {
  const t = useCatalogueText(MESSAGES.en);
  const kinds = [
    ["line", "chart-1"],
    ["area", "chart-2"],
    ["bar", "chart-3"],
  ] as const;
  return (
    <div className="grid w-full gap-6 sm:grid-cols-3">
      {kinds.map(([kind, color]) => (
        <figure key={kind} className="m-0 grid gap-2">
          <Sparkline data={WEEKS} kind={kind} label={t(K[kind])} color={color} height={40} />
          <figcaption className="text-xs text-muted">{t(K[`${kind}_caption`])}</figcaption>
        </figure>
      ))}
    </div>
  );
}
