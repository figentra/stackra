/**
 * Stackra file contract:
 * Purpose: the page of the ActionPalette route: `@stackra-pro/ui`'s ActionPalette opened by a button or by Ctrl or
 *          Cmd with K, with three groups of actions, a search field that filters them, an empty state, and a line
 *          that says which action ran last.
 * Boundary: presentation and local state only. HeroUI Pro's palette has no shortcut of its own (its docs show the key
 *          as a hint on the button), so the page binds Ctrl or Cmd with K to opening it. The container is `lg`: HeroUI
 *          Pro caps `md` at 356px, where the six actions scroll, and axe flags a scroll region without focusable
 *          content (the palette's items take virtual focus from the search field).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0310 (decision 6); ADR 0060 (light, dark, RTL); STA-403 FR-013.
 */
import { Kbd } from "@heroui/react";
import { Button } from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useEffect, useState } from "react";

import { DemoIcon, type DemoIconName } from "#src/components/demo-icon";
import { ProActionPaletteRoute } from "#src/routes/pro-action-palette/pro-action-palette.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-action-palette.*` keys.
const STRINGS = {
  documentTitle: `${ProActionPaletteRoute.title} · Stackra Playground`,
  intro:
    "A searchable list of actions in a dialog. Open it with the button or with Ctrl or Cmd and K, type to filter, press Enter or choose an action, and Escape closes it.",
  open: "Open action palette",
  // Words, not the Command symbol: axe cannot measure the contrast of a glyph that is not text.
  shortcut: "Ctrl K",
  dialog: "Action palette",
  search: "Search actions",
  placeholder: "Type an action or search",
  list: "Actions",
  empty: "No actions match.",
  hint: "Use the arrow keys to move, Enter to run, Escape to close.",
  none: "No action has run yet.",
  last: (label: string) => `Last action: ${label}`,
} as const;

/** One action of the palette. */
interface PaletteAction {
  readonly id: string;
  readonly label: string;
  readonly icon: DemoIconName;
}

const GROUPS: readonly { readonly heading: string; readonly actions: readonly PaletteAction[] }[] =
  [
    {
      heading: "Navigate",
      actions: [
        { id: "go-dashboard", label: "Go to dashboard", icon: "home" },
        { id: "go-invoices", label: "Go to invoices", icon: "doc" },
      ],
    },
    {
      heading: "Create",
      actions: [
        { id: "new-invoice", label: "Create invoice", icon: "money" },
        { id: "invite", label: "Invite teammate", icon: "users" },
      ],
    },
    {
      heading: "Settings",
      actions: [
        { id: "preferences", label: "Open preferences", icon: "gear" },
        { id: "find-docs", label: "Search the docs", icon: "search" },
      ],
    },
  ];

const LABELS = new Map(GROUPS.flatMap((group) => group.actions).map((a) => [a.id, a.label]));

/** The ActionPalette page. */
export function ProActionPalette() {
  const [isOpen, setOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProActionPaletteRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <div>
        <Button
          variant="outline"
          aria-keyshortcuts="Control+K Meta+K"
          onPress={() => setOpen(true)}
        >
          {STRINGS.open}
          <Kbd>
            <Kbd.Content>{STRINGS.shortcut}</Kbd.Content>
          </Kbd>
        </Button>
      </div>
      <p role="status" className="text-muted">
        <bdi>{lastAction ? STRINGS.last(lastAction) : STRINGS.none}</bdi>
      </p>
      <UiPro.ActionPalette>
        <UiPro.ActionPalette.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
          <UiPro.ActionPalette.Container size="lg">
            <UiPro.ActionPalette.Dialog label={STRINGS.dialog}>
              <UiPro.ActionPalette.InputGroup label={STRINGS.search}>
                <UiPro.ActionPalette.InputGroup.Prefix>
                  <DemoIcon name="search" />
                </UiPro.ActionPalette.InputGroup.Prefix>
                <UiPro.ActionPalette.InputGroup.Input placeholder={STRINGS.placeholder} />
                <UiPro.ActionPalette.InputGroup.ClearButton />
              </UiPro.ActionPalette.InputGroup>
              <UiPro.ActionPalette.List
                aria-label={STRINGS.list}
                renderEmptyState={() => STRINGS.empty}
                onAction={(key) => {
                  setLastAction(LABELS.get(String(key)) ?? String(key));
                  setOpen(false);
                }}
              >
                {GROUPS.map((group) => (
                  <UiPro.ActionPalette.Group key={group.heading} heading={group.heading}>
                    {group.actions.map((action) => (
                      <UiPro.ActionPalette.Item
                        key={action.id}
                        id={action.id}
                        textValue={action.label}
                      >
                        <DemoIcon name={action.icon} />
                        <span>{action.label}</span>
                      </UiPro.ActionPalette.Item>
                    ))}
                  </UiPro.ActionPalette.Group>
                ))}
              </UiPro.ActionPalette.List>
              <UiPro.ActionPalette.Footer>{STRINGS.hint}</UiPro.ActionPalette.Footer>
            </UiPro.ActionPalette.Dialog>
          </UiPro.ActionPalette.Container>
        </UiPro.ActionPalette.Backdrop>
      </UiPro.ActionPalette>
    </article>
  );
}
