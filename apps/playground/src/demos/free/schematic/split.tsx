/**
 * Stackra file contract:
 * Purpose: the "split" demo of the web Schematic: one action piped into its three surfaces (an HTTP endpoint, an MCP
 *          tool and a queued job), each part a schematic `Frame`.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The frames'
 *           titles are file names and identifiers (code, never translated); what each part is comes from the
 *           catalogues.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0501 (section 9, the blueprint roles); STA-2041.
 */
import { Frame, Schematic, SchematicNode, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEMATIC_KEYS } from "#src/demos/free/schematic/schematic-keys.constant";

/** The demo's keys. */
const K = SCHEMATIC_KEYS.schematic;

/** The three surfaces the action reaches. */
const SURFACES = [
  { id: "endpoint", title: "PUT /subscriptions/:id/cancel", note: K.endpoint },
  { id: "tool", title: "billing_subscription_cancel", note: K.tool },
  { id: "job", title: "Queues.billing", note: K.job },
] as const;

/** One pipe from the action to each surface; a constant, so the machine measures once. */
const LINKS = SURFACES.map((surface) => ({ from: "action", to: surface.id }));

/** Schematic: one into three. */
export default function Split() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Schematic
      label={t(K.split_label)}
      links={LINKS}
      className="flex w-full max-w-xl flex-col gap-12"
    >
      <SchematicNode id="action" className="mx-auto w-full max-w-xs">
        <Frame variant="schematic" title="cancel-subscription.action.ts">
          <Text type="small" tone="muted" className="p-3">
            {t(K.action)}
          </Text>
        </Frame>
      </SchematicNode>
      <div className="flex flex-wrap items-start justify-center gap-4">
        {SURFACES.map((surface) => (
          <SchematicNode key={surface.id} id={surface.id} className="min-w-0 flex-1 basis-36">
            <Frame variant="schematic" title={surface.title}>
              <Text type="small" tone="muted" className="p-3">
                {t(surface.note)}
              </Text>
            </Frame>
          </SchematicNode>
        ))}
      </div>
    </Schematic>
  );
}
