/**
 * Stackra file contract:
 * Purpose: the "breakpoints" demo of the web Two column layout: collapseBelow names a Tailwind breakpoint: md is 768
 *          px, xl is 1280 px. Between them, one of these layouts is stacked while the other is not.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317 (decisions 1 and 6); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 1.3.2,
 *          1.4.10 and 4.1.3.
 */
import type { LayoutBreakpoint } from "@stackra/ui/contracts";
import {
  Section,
  Text,
  TwoColumnLayout as UiTwoColumnLayout,
  useCatalogueText,
} from "@stackra/ui/react";
import type { ReactNode } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { TWO_COLUMN_LAYOUT_KEYS } from "#src/demos/free/two-column-layout/two-column-layout-keys.constant";

/** The demo's keys. */
const K = TWO_COLUMN_LAYOUT_KEYS.two_column_layout;

/** The box a layout sits in, so its edges show. */
const BOX = "border border-border p-4";

/** A caption above the box a layout sits in. */
function Sample({
  caption,
  children,
  sample,
}: {
  readonly caption: string;
  readonly children: ReactNode;
  readonly sample: string;
}) {
  return (
    <div className="grid content-start gap-2">
      <Text tone="muted" type="small">
        {caption}
      </Text>
      <div className={BOX} data-sample={sample}>
        {children}
      </div>
    </div>
  );
}

/** One main column and one side column that collapse at `collapseBelow`. */
function Collapsing({
  collapseBelow,
  main,
  aside,
}: {
  readonly collapseBelow: LayoutBreakpoint;
  readonly main: string;
  readonly aside: string;
}) {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <UiTwoColumnLayout
      collapseBelow={collapseBelow}
      aside={
        <Section headingLevel={3} title={aside}>
          <Text>{t(K.aside_body)}</Text>
        </Section>
      }
    >
      <Section headingLevel={3} title={main}>
        <Text>{t(K.main_body)}</Text>
      </Section>
    </UiTwoColumnLayout>
  );
}

/** Two column layout: Collapse breakpoints. */
export default function Breakpoints() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid gap-6">
      <Sample caption={t(K.md_caption)} sample="md">
        <Collapsing collapseBelow="md" main={t(K.md_main)} aside={t(K.md_aside)} />
      </Sample>
      <Sample caption={t(K.xl_caption)} sample="xl">
        <Collapsing collapseBelow="xl" main={t(K.xl_main)} aside={t(K.xl_aside)} />
      </Sample>
    </div>
  );
}
