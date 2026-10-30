/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Screen: Switch scrolling and choose the edges. The screen below follows, and
 *          the page reports what it is set to.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.4.10,
 *          2.1.1 and 4.1.3.
 */
import type { ScreenEdge } from "@stackra/ui/contracts";
import {
  Button,
  CheckboxGroup,
  Screen as UiScreen,
  Switch,
  Text,
  useCatalogueText,
} from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCREEN_KEYS } from "#src/demos/free/screen/screen-keys.constant";

/** The demo's keys. */
const K = SCREEN_KEYS.screen;

/** The box a screen sits in, tall enough to show a gap and to need scrolling. */
const BOX = "h-36 border border-border";

/** A few lines of order text, tall enough to scroll in a short box. */
function Lines({
  count,
  line,
}: {
  readonly count: number;
  readonly line: (index: number) => string;
}) {
  return (
    <ul className="grid gap-1 p-3">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <Text>{line(index)}</Text>
        </li>
      ))}
    </ul>
  );
}

/** Screen: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  /** The edges the contract names, as the options of the live group. */
  const EDGE_OPTIONS = [
    { value: "top", label: t(K.sample.top) },
    { value: "bottom", label: t(K.sample.bottom) },
    { value: "sides", label: t(K.sample.sides) },
  ] as const;
  const [isScrollable, setIsScrollable] = useState(true);

  const [edges, setEdges] = useState<readonly string[]>(["top", "bottom", "sides"]);

  const [pressed, setPressed] = useState(0);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start gap-6">
        <Switch label={t(K.scroll_switch)} value={isScrollable} onChange={setIsScrollable} />
        <CheckboxGroup
          label={t(K.edges_group)}
          options={EDGE_OPTIONS}
          value={edges}
          onChange={setEdges}
        />
      </div>
      <UiScreen
        isEmbedded
        isScrollable={isScrollable}
        edges={edges as readonly ScreenEdge[]}
        className={BOX}
        data-sample="live"
      >
        <div className="p-3">
          <Button size="sm" onPress={() => setPressed((count) => count + 1)}>
            {t(K.press)}
          </Button>
        </div>
        <Lines count={12} line={(index) => t(K.line, { index: index + 1 })} />
      </UiScreen>
      <div className="grid gap-1" data-sample="live-status">
        <Text role="status" tone="muted">
          {t(K.settings, { is_scrollable: isScrollable, edges: edges.join(", ") || "none" })}
        </Text>
        <Text role="status" tone="muted">
          {t(K.pressed, { count: pressed })}
        </Text>
      </div>
    </div>
  );
}
