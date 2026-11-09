/**
 * Stackra file contract:
 * Purpose: the "chain" demo of the web Schematic: a model, gen and the locked manifest joined one after another,
 *          each part set further along the line, so every pipe turns across with a junction square.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown. The frames'
 *           titles are file names and a command (code, never translated). The nodes sit on logical sides, so
 *           right-to-left mirrors the chain and the measured pipes follow.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); ADR 0501 (section 9, the blueprint roles); STA-2041.
 */
import { Frame, Schematic, SchematicNode, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { SCHEMATIC_KEYS } from "#src/demos/free/schematic/schematic-keys.constant";

/** The demo's keys. */
const K = SCHEMATIC_KEYS.schematic;

/** The parts in order, each placed further along the line. */
const PARTS = [
  { id: "model", title: "subscription.model.ts", note: K.model, place: "justify-self-start" },
  { id: "gen", title: "stackra gen", note: K.gen, place: "justify-self-center" },
  { id: "manifest", title: "stackra.manifest.json", note: K.manifest, place: "justify-self-end" },
] as const;

/** Each part piped into the next; a constant, so the machine measures once. */
const LINKS = [
  { from: "model", to: "gen" },
  { from: "gen", to: "manifest" },
];

/** Schematic: a chain. */
export default function Chain() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Schematic label={t(K.chain_label)} links={LINKS} className="grid w-full max-w-lg gap-10">
      {PARTS.map((part) => (
        <SchematicNode key={part.id} id={part.id} className={`w-full max-w-56 ${part.place}`}>
          <Frame variant="schematic" title={part.title}>
            <Text type="small" tone="muted" className="p-3">
              {t(part.note)}
            </Text>
          </Frame>
        </SchematicNode>
      ))}
    </Schematic>
  );
}
