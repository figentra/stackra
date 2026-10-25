/**
 * Stackra file contract:
 * Purpose: the page of the ItemCardGroup route: `@stackra-pro/ui`'s ItemCardGroup as a titled list of three
 *          integrations joined into one surface by separators, each with a button that names it and reports which
 *          was pressed, and as a two-column grid of the same cards.
 * Boundary: presentation and local state only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { Fragment, useState } from "react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";
import { ProItemCardGroupRoute } from "#src/routes/pro-item-card-group/pro-item-card-group.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-item-card-group.*` keys.
const STRINGS = {
  documentTitle: `${ProItemCardGroupRoute.title} · Stackra Playground`,
  intro:
    "Item cards grouped under a title: a list joined into one surface, or a grid of separate cards.",
  list: "Integrations",
  listText: "Connect the tools your team already uses",
  grid: "As a grid",
  none: "No integration has been chosen yet.",
  last: (label: string) => `Last chosen: ${label}`,
  manage: (name: string) => `Manage ${name}`,
  button: "Manage",
} as const;

const INTEGRATIONS: readonly {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly icon: DemoIconName;
}[] = [
  { id: "source", name: "Source control", text: "Connected to two repositories", icon: "doc" },
  { id: "chat", name: "Team chat", text: "Posts a message when a build fails", icon: "users" },
  { id: "billing", name: "Billing", text: "Syncs invoices every night", icon: "money" },
];

/** The ItemCardGroup page. */
export function ProItemCardGroup() {
  const [last, setLast] = useState<string | null>(null);

  const card = (integration: (typeof INTEGRATIONS)[number]) => (
    <UiPro.ItemCard>
      <UiPro.ItemCard.Icon>
        <DemoIcon name={integration.icon} />
      </UiPro.ItemCard.Icon>
      <UiPro.ItemCard.Content>
        <UiPro.ItemCard.Title>{integration.name}</UiPro.ItemCard.Title>
        <UiPro.ItemCard.Description>{integration.text}</UiPro.ItemCard.Description>
      </UiPro.ItemCard.Content>
      <UiPro.ItemCard.Action>
        <Ui.Button
          size="sm"
          variant="outline"
          label={STRINGS.manage(integration.name)}
          onPress={() => setLast(integration.name)}
        >
          {STRINGS.button}
        </Ui.Button>
      </UiPro.ItemCard.Action>
    </UiPro.ItemCard>
  );

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProItemCardGroupRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="list-heading" className="grid max-w-xl gap-3">
        <h2 id="list-heading" className="type-h2">
          {STRINGS.list}
        </h2>
        <UiPro.ItemCardGroup>
          <UiPro.ItemCardGroup.Header>
            <UiPro.ItemCardGroup.Title>{STRINGS.list}</UiPro.ItemCardGroup.Title>
            <UiPro.ItemCardGroup.Description>{STRINGS.listText}</UiPro.ItemCardGroup.Description>
          </UiPro.ItemCardGroup.Header>
          {INTEGRATIONS.map((integration, index) => (
            <Fragment key={integration.id}>
              {index > 0 ? <Ui.Separator /> : null}
              {card(integration)}
            </Fragment>
          ))}
        </UiPro.ItemCardGroup>
        <p role="status">
          <bdi>{last === null ? STRINGS.none : STRINGS.last(last)}</bdi>
        </p>
      </section>
      <section aria-labelledby="grid-heading" className="grid max-w-3xl gap-3">
        <h2 id="grid-heading" className="type-h2">
          {STRINGS.grid}
        </h2>
        <UiPro.ItemCardGroup layout="grid" columns={2}>
          {INTEGRATIONS.map((integration) => (
            <Fragment key={integration.id}>{card(integration)}</Fragment>
          ))}
        </UiPro.ItemCardGroup>
      </section>
    </article>
  );
}
