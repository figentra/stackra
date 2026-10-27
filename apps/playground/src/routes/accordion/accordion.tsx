/**
 * Stackra file contract:
 * Purpose: the page of the accordion route: a single-open accordion, one that keeps several open, both variants,
 *          sections open at the start, a disabled section and a disabled accordion, rich content in a section, and a live
 *          example whose open sections are held by the page and can be changed from outside, all from
 *          `@stackra/ui/react` with real props.
 * Boundary: presentation only; strings in one `STRINGS` constant until @stackra/i18n.
 * Runtime: browser
 * Governing contract: ADR 0302 (decisions 3 and 5); ADR 0313; ADR 0060 (light, dark, RTL).
 */
import { AccordionVariant } from "@stackra/ui/contracts";
import { Accordion as UiAccordion, Button, Heading, Link, Text } from "@stackra/ui/react";
import { useState } from "react";

import { PageSection } from "#src/components/page-section";
import { AccordionRoute } from "#src/routes/accordion/accordion.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::accordion.*` keys.
const STRINGS = {
  documentTitle: `${AccordionRoute.title} · Stackra Playground`,
  intro:
    "An accordion stacks sections whose titles open and close their content. The open sections are a list of ids, in the order of the sections. Opening one closes the others unless the accordion may keep several open.",
  single: "One open at a time",
  singleNote:
    "The default: opening a section closes the one that was open, and pressing it again closes it.",
  multiple: "Several open",
  multipleNote: "With `canExpandMultiple` each section opens and closes on its own.",
  variants: "Variants",
  variantsNote: "The default sits on the page; the surface variant is a tinted panel of its own.",
  variant: (variant: string) => `${variant} accordion`,
  expanded: "Open at the start",
  expandedNote: "`defaultExpandedKeys` opens sections before the user has pressed anything.",
  states: "States",
  statesNote:
    "A disabled section is shown but refused; a disabled accordion refuses every section and keeps the open ones open.",
  rich: "Rich content",
  richNote: "A title or content that is not a string is drawn as it is, here a link in a section.",
  live: "Try it",
  liveNote:
    "Open and close sections, or use the buttons: the page holds the open ids and reports them in the order of the sections.",
  open: (keys: readonly string[]) => `Open: ${keys.length === 0 ? "none" : keys.join(", ")}`,
  expandAll: "Expand all",
  collapseAll: "Collapse all",
  docsLink: "Read the returns policy",
} as const;

/** The sections of most samples. */
const FAQ = [
  {
    id: "shipping",
    title: "How long does shipping take?",
    content: "Orders ship within two working days.",
  },
  {
    id: "returns",
    title: "Can I return an order?",
    content: "Yes, within thirty days and free of charge.",
  },
  {
    id: "warranty",
    title: "Is there a warranty?",
    content: "Every product has a two year warranty.",
  },
] as const;

/** The same sections with one refused. */
const FAQ_ONE_DISABLED = [
  {
    id: "shipping",
    title: "How long does shipping take?",
    content: "Orders ship within two working days.",
  },
  {
    id: "returns",
    title: "Can I return an order?",
    content: "Yes, within thirty days and free of charge.",
    isDisabled: true,
  },
  {
    id: "warranty",
    title: "Is there a warranty?",
    content: "Every product has a two year warranty.",
  },
] as const;

/** The same sections with a link in one. */
const FAQ_RICH = [
  {
    id: "shipping",
    title: "How long does shipping take?",
    content: "Orders ship within two working days.",
  },
  {
    id: "returns",
    title: "Can I return an order?",
    content: (
      <Link href="https://example.com/returns" isExternal>
        {STRINGS.docsLink}
      </Link>
    ),
  },
] as const;

/** The ids of every section, for the live example's buttons. */
const ALL_IDS = FAQ.map((section) => section.id);

/** The grid that lays the samples out in a wrapping row. */
const ROW = "flex flex-wrap items-start gap-8";

/** The width of one accordion in a row. */
const WIDTH = "w-96 max-w-full";

/** The Accordion page. */
export function Accordion() {
  const [open, setOpen] = useState<readonly string[]>(["shipping"]);

  return (
    <article className="grid gap-10">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <Heading level={1}>{AccordionRoute.title}</Heading>
        <Text className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </Text>
      </header>

      <PageSection id="accordion-single" title={STRINGS.single} note={STRINGS.singleNote}>
        <UiAccordion items={FAQ} className={WIDTH} />
      </PageSection>

      <PageSection id="accordion-multiple" title={STRINGS.multiple} note={STRINGS.multipleNote}>
        <UiAccordion items={FAQ} canExpandMultiple className={WIDTH} />
      </PageSection>

      <PageSection id="accordion-variants" title={STRINGS.variants} note={STRINGS.variantsNote}>
        <div className={ROW}>
          {AccordionVariant.map((variant) => (
            <div key={variant} className="grid gap-2">
              <Text tone="muted">{STRINGS.variant(variant)}</Text>
              <UiAccordion items={FAQ} variant={variant} className={WIDTH} />
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection id="accordion-expanded" title={STRINGS.expanded} note={STRINGS.expandedNote}>
        <UiAccordion
          items={FAQ}
          canExpandMultiple
          defaultExpandedKeys={["shipping", "warranty"]}
          className={WIDTH}
        />
      </PageSection>

      <PageSection id="accordion-states" title={STRINGS.states} note={STRINGS.statesNote}>
        <div className={ROW}>
          <UiAccordion items={FAQ_ONE_DISABLED} className={WIDTH} />
          <UiAccordion
            items={FAQ}
            isDisabled
            canExpandMultiple
            defaultExpandedKeys={["shipping"]}
            className={WIDTH}
          />
        </div>
      </PageSection>

      <PageSection id="accordion-rich" title={STRINGS.rich} note={STRINGS.richNote}>
        <UiAccordion items={FAQ_RICH} className={WIDTH} />
      </PageSection>

      <PageSection id="accordion-live" title={STRINGS.live} note={STRINGS.liveNote}>
        <UiAccordion
          items={FAQ}
          canExpandMultiple
          expandedKeys={open}
          onExpandedChange={setOpen}
          className={WIDTH}
        />
        <Text role="status" data-testid="accordion-open" tone="muted">
          {STRINGS.open(open)}
        </Text>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onPress={() => setOpen(ALL_IDS)}>
            {STRINGS.expandAll}
          </Button>
          <Button variant="secondary" onPress={() => setOpen([])}>
            {STRINGS.collapseAll}
          </Button>
        </div>
      </PageSection>
    </article>
  );
}
