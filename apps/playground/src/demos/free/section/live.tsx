/**
 * Stackra file contract:
 * Purpose: the "live" demo of the web Section: Edit switches the section between viewing and editing. Choose an entry
 *          in the menu and the page reports it below.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0317; ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.4.6, 2.5.8 and 4.1.3.
 */
import { Section as UiSection, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_KEYS } from "#src/demos/free/section/section-keys.constant";

/** The demo's keys. */
const K = SECTION_KEYS.section;

/** Section: Try it. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [isEditing, setIsEditing] = useState(false);

  const [action, setAction] = useState<string | null>(null);

  const choose = (label: string) => () => setAction(label);

  return (
    <div className="grid gap-3">
      <div data-sample="live">
        <UiSection
          headingLevel={3}
          title={t(K.live_title)}
          description={t(K.live_line)}
          moreActionsLabel={t(K.more_actions)}
          actions={[
            {
              id: "edit",
              label: isEditing ? t(K.done) : t(K.edit),
              onPress: () => setIsEditing((editing) => !editing),
            },
            { id: "copy", label: t(K.copy), onPress: choose(t(K.copy)) },
            { id: "export", label: t(K.export), onPress: choose(t(K.export)) },
            { id: "print", label: t(K.print), onPress: choose(t(K.print)) },
            { id: "archive", label: t(K.archive), onPress: choose(t(K.archive)) },
          ]}
        >
          <Text data-sample="live-body">{isEditing ? t(K.editing) : t(K.viewing)}</Text>
        </UiSection>
      </div>
      <Text role="status" tone="muted" data-sample="live-status">
        {t(K.action_status, { action: action ?? "none" })}
      </Text>
    </div>
  );
}
