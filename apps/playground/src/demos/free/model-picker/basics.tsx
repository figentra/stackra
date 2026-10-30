/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web ModelPicker: four models from two providers with capability tags, context
 *          sizes, a New and a Beta badge and one model held for the Business plan, with the picked model named below.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           Model names are product names, never translated.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { ModelPicker, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MODEL_PICKER_KEYS } from "#src/demos/free/model-picker/model-picker-keys.constant";

/** The demo's keys. */
const K = MODEL_PICKER_KEYS.model_picker.basics;

/** Four models from two providers; one is disabled with a reason, and the pick is shown below. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const models = [
    {
      id: "swift",
      name: "Najm Swift",
      provider: "Najm",
      icon: Icons.Zap,
      description: t(K.swift),
      capabilities: [t(K.fast), t(K.arabic)],
      contextWindow: 128_000,
    },
    {
      id: "deep",
      name: "Najm Deep",
      provider: "Najm",
      icon: Icons.Sparkles,
      description: t(K.deep),
      capabilities: [t(K.reasoning), t(K.arabic)],
      contextWindow: 200_000,
      badge: "new" as const,
    },
    {
      id: "vision",
      name: "Contoso Vision",
      provider: "Contoso",
      icon: Icons.Image,
      description: t(K.vision),
      capabilities: [t(K.vision_tag)],
      contextWindow: 64_000,
      badge: "beta" as const,
    },
    {
      id: "atlas",
      name: "Contoso Atlas",
      provider: "Contoso",
      icon: Icons.Rocket,
      description: t(K.atlas),
      capabilities: [t(K.reasoning), t(K.vision_tag)],
      contextWindow: 1_000_000,
      isDisabled: true,
      disabledReason: t(K.business),
    },
  ];
  const [picked, setPicked] = useState("deep");
  return (
    <div className="grid w-full max-w-sm gap-3">
      <ModelPicker models={models} value={picked} onChange={setPicked} isFullWidth />
      <Text tone="muted">
        {t(K.picked, { name: models.find((model) => model.id === picked)?.name ?? "" })}
      </Text>
    </div>
  );
}
