/**
 * Stackra file contract:
 * Purpose: `MDX_COMPONENTS_TEMPLATE`, the `app/mdx-components.tsx` of a generated Fumadocs site: Fumadocs' MDX
 *          components plus the transitional map of the Mintlify names pages still use: `Note`, `Info`, `Tip`,
 *          `Warning` and `Check` as a `Callout` of the matching type, `Card` and `CardGroup` as `Card` and `Cards`,
 *          `Steps` and `Step`, `Tabs` and `Tab` (the tab titles become the items), `Accordion` and
 *          `AccordionGroup` (a lone `Accordion` gets its own group), `Frame` as a figure and `CodeGroup` as stacked
 *          code blocks.
 * Boundary: a constant; `emitDocsSite` refuses a capitalised tag that is neither here nor imported by its page
 *           (`docs_component_unknown`), so keep its name list in step with this map.
 * Runtime: isomorphic
 * Governing contract: ADR 0514 (decision 10: the transitional Mintlify mapping); STA-2026 (FR-009, research R7).
 */

/** The emitted `app/mdx-components.tsx`. */
export const MDX_COMPONENTS_TEMPLATE = `import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { Children, createContext, isValidElement, useContext, type ReactNode } from "react";

type Props = {
  readonly children?: ReactNode;
  readonly title?: string;
  readonly [prop: string]: unknown;
};

const callout =
  (type: "info" | "idea" | "warning" | "success") =>
  ({ title, children }: Props) => (
    <Callout type={type} title={title}>
      {children}
    </Callout>
  );

function MintlifyCard({ title, href, icon, description, children }: Props) {
  return (
    <Card
      title={title ?? ""}
      description={description as ReactNode}
      href={typeof href === "string" ? href : undefined}
      icon={typeof icon === "string" ? undefined : (icon as ReactNode)}
    >
      {children}
    </Card>
  );
}

function MintlifyStep({ title, children }: Props) {
  return (
    <Step>
      {title === undefined ? null : <h3>{title}</h3>}
      {children}
    </Step>
  );
}

function MintlifyTabs({ children }: Props) {
  const items = Children.toArray(children)
    .filter(isValidElement)
    .map((tab) => String((tab.props as Props).title ?? ""));
  return <Tabs items={items}>{children}</Tabs>;
}

function MintlifyTab({ title, children }: Props) {
  return <Tab value={title}>{children}</Tab>;
}

const InGroup = createContext(false);

function MintlifyAccordionGroup({ children }: Props) {
  return (
    <InGroup.Provider value={true}>
      <Accordions type="multiple">{children as ReactNode}</Accordions>
    </InGroup.Provider>
  );
}

function MintlifyAccordion({ title, children }: Props) {
  const item = <Accordion title={title ?? ""}>{children}</Accordion>;
  return useContext(InGroup) ? item : <Accordions type="single">{item}</Accordions>;
}

function Frame({ caption, children }: Props) {
  return (
    <figure>
      {children}
      {typeof caption === "string" ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function CodeGroup({ children }: Props) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export const mdxComponents = {
  ...defaultMdxComponents,
  Note: callout("info"),
  Info: callout("info"),
  Tip: callout("idea"),
  Warning: callout("warning"),
  Check: callout("success"),
  Card: MintlifyCard,
  CardGroup: Cards,
  Steps,
  Step: MintlifyStep,
  Tabs: MintlifyTabs,
  Tab: MintlifyTab,
  Accordion: MintlifyAccordion,
  AccordionGroup: MintlifyAccordionGroup,
  Frame,
  CodeGroup,
};
`;
