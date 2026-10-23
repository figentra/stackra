/**
 * Stackra file contract:
 * Purpose: the page of the EmptyState route: `@stackra/ui-pro`'s EmptyState as a full one (an icon, a title, a
 *          description and two actions that report which one ran) and as a minimal one (a title and a description).
 * Boundary: presentation and local state only.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import { Button } from "@heroui/react";
import * as UiPro from "@stackra/ui-pro/react";
import { useState } from "react";

import { DemoIcon } from "#src/components/demo-icon";
import { ProEmptyStateRoute } from "#src/routes/pro-empty-state/pro-empty-state.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-empty-state.*` keys.
const STRINGS = {
  documentTitle: `${ProEmptyStateRoute.title} · Stackra Playground`,
  intro:
    "What a list or page shows when it has nothing yet: say what is missing and offer the next step.",
  full: "With actions",
  title: "No projects yet",
  description: "You have not created a project. Create your first one to get started.",
  create: "Create project",
  import: "Import project",
  minimal: "Minimal",
  minimalTitle: "Nothing here yet",
  minimalDescription: "Content will appear here once it becomes available.",
  none: "No action has run yet.",
  last: (label: string) => `Last action: ${label}`,
} as const;

/** The EmptyState page. */
export function ProEmptyState() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProEmptyStateRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="full-heading" className="grid gap-3">
        <h2 id="full-heading" className="type-h2">
          {STRINGS.full}
        </h2>
        <div className="max-w-md">
          <UiPro.EmptyState>
            <UiPro.EmptyState.Header>
              <UiPro.EmptyState.Media variant="icon">
                <DemoIcon name="doc" />
              </UiPro.EmptyState.Media>
              <UiPro.EmptyState.Title>{STRINGS.title}</UiPro.EmptyState.Title>
              <UiPro.EmptyState.Description>{STRINGS.description}</UiPro.EmptyState.Description>
            </UiPro.EmptyState.Header>
            <UiPro.EmptyState.Content className="flex-row gap-2">
              <Button onPress={() => setLast(STRINGS.create)}>{STRINGS.create}</Button>
              <Button variant="outline" onPress={() => setLast(STRINGS.import)}>
                {STRINGS.import}
              </Button>
            </UiPro.EmptyState.Content>
          </UiPro.EmptyState>
        </div>
        <p role="status">
          <bdi>{last === null ? STRINGS.none : STRINGS.last(last)}</bdi>
        </p>
      </section>
      <section aria-labelledby="minimal-heading" className="grid gap-3">
        <h2 id="minimal-heading" className="type-h2">
          {STRINGS.minimal}
        </h2>
        <div className="max-w-md">
          <UiPro.EmptyState>
            <UiPro.EmptyState.Header>
              <UiPro.EmptyState.Title>{STRINGS.minimalTitle}</UiPro.EmptyState.Title>
              <UiPro.EmptyState.Description>
                {STRINGS.minimalDescription}
              </UiPro.EmptyState.Description>
            </UiPro.EmptyState.Header>
          </UiPro.EmptyState>
        </div>
      </section>
    </article>
  );
}
