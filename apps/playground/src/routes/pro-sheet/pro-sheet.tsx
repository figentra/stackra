/**
 * Stackra file contract:
 * Purpose: the page of the Sheet route: `@stackra-pro/ui`'s Sheet opened from two named buttons, a bottom sheet with a
 *          handle and a side sheet with a form, each a dialog named by its heading with a close button and a footer
 *          that reports the choice made.
 * Boundary: presentation and local state only. The edge is a physical one (`bottom`, `right`), as HeroUI Pro's is.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0060 (light, dark, RTL); STA-416 FR-012.
 */
import * as Ui from "@stackra/ui/react";
import * as UiPro from "@stackra-pro/ui/react";
import { useState } from "react";

import { ProSheetRoute } from "#src/routes/pro-sheet/pro-sheet.route";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::pro-sheet.*` keys.
const STRINGS = {
  documentTitle: `${ProSheetRoute.title} · Stackra Playground`,
  intro:
    "A panel that slides in from an edge. Open one with its button; Escape, the close button, a press on the dimmed area or a drag closes it.",
  sheets: "Sheets",
  openBottom: "Open the bottom sheet",
  openSide: "Open the side sheet",
  bottomTitle: "Share this report",
  bottomBody: "Anyone in your workspace with the link can view this report.",
  sideTitle: "Edit profile",
  name: "Name",
  email: "Email",
  cancel: "Cancel",
  confirm: "Confirm",
  save: "Save changes",
  none: "No sheet has been answered yet.",
  last: (label: string) => `Last answer: ${label}`,
} as const;

/** The Sheet page. */
export function ProSheet() {
  const [open, setOpen] = useState<"bottom" | "side" | null>(null);
  const [last, setLast] = useState<string | null>(null);
  // An answer reports itself and closes the sheet it came from.
  const answer = (label: string) => {
    setLast(label);
    setOpen(null);
  };

  return (
    <article className="grid gap-6">
      <title>{STRINGS.documentTitle}</title>
      <header className="grid gap-2">
        <h1 className="type-h1">{ProSheetRoute.title}</h1>
        <p className="max-w-prose">
          <bdi>{STRINGS.intro}</bdi>
        </p>
      </header>
      <section aria-labelledby="sheets-heading" className="grid gap-3">
        <h2 id="sheets-heading" className="type-h2">
          {STRINGS.sheets}
        </h2>
        <div className="flex flex-wrap gap-3">
          <UiPro.Sheet
            isOpen={open === "bottom"}
            onOpenChange={(isOpen) => setOpen(isOpen ? "bottom" : null)}
          >
            <UiPro.Sheet.Trigger>
              <Ui.Button variant="secondary">{STRINGS.openBottom}</Ui.Button>
            </UiPro.Sheet.Trigger>
            <UiPro.Sheet.Backdrop>
              <UiPro.Sheet.Content className="mx-auto max-h-[95vh] max-w-[420px]">
                <UiPro.Sheet.Dialog>
                  <UiPro.Sheet.Handle />
                  <UiPro.Sheet.CloseTrigger />
                  <UiPro.Sheet.Header>
                    <UiPro.Sheet.Heading>{STRINGS.bottomTitle}</UiPro.Sheet.Heading>
                  </UiPro.Sheet.Header>
                  <UiPro.Sheet.Body>
                    <p>
                      <bdi>{STRINGS.bottomBody}</bdi>
                    </p>
                  </UiPro.Sheet.Body>
                  <UiPro.Sheet.Footer>
                    <Ui.Button variant="secondary" onPress={() => answer(STRINGS.cancel)}>
                      {STRINGS.cancel}
                    </Ui.Button>
                    <Ui.Button onPress={() => answer(STRINGS.confirm)}>{STRINGS.confirm}</Ui.Button>
                  </UiPro.Sheet.Footer>
                </UiPro.Sheet.Dialog>
              </UiPro.Sheet.Content>
            </UiPro.Sheet.Backdrop>
          </UiPro.Sheet>
          <UiPro.Sheet
            placement="right"
            isOpen={open === "side"}
            onOpenChange={(isOpen) => setOpen(isOpen ? "side" : null)}
          >
            <UiPro.Sheet.Trigger>
              <Ui.Button variant="secondary">{STRINGS.openSide}</Ui.Button>
            </UiPro.Sheet.Trigger>
            <UiPro.Sheet.Backdrop>
              <UiPro.Sheet.Content className="w-[400px]">
                <UiPro.Sheet.Dialog>
                  <UiPro.Sheet.CloseTrigger />
                  <UiPro.Sheet.Header>
                    <UiPro.Sheet.Heading>{STRINGS.sideTitle}</UiPro.Sheet.Heading>
                  </UiPro.Sheet.Header>
                  <UiPro.Sheet.Body>
                    <form className="grid gap-4">
                      <Ui.TextField
                        className="w-full"
                        name="name"
                        label={STRINGS.name}
                        variant="secondary"
                      />
                      <Ui.TextField
                        className="w-full"
                        name="email"
                        type="email"
                        label={STRINGS.email}
                        variant="secondary"
                      />
                    </form>
                  </UiPro.Sheet.Body>
                  <UiPro.Sheet.Footer>
                    <Ui.Button variant="secondary" onPress={() => answer(STRINGS.cancel)}>
                      {STRINGS.cancel}
                    </Ui.Button>
                    <Ui.Button onPress={() => answer(STRINGS.save)}>{STRINGS.save}</Ui.Button>
                  </UiPro.Sheet.Footer>
                </UiPro.Sheet.Dialog>
              </UiPro.Sheet.Content>
            </UiPro.Sheet.Backdrop>
          </UiPro.Sheet>
        </div>
        <p role="status">
          <bdi>{last === null ? STRINGS.none : STRINGS.last(last)}</bdi>
        </p>
      </section>
    </article>
  );
}
