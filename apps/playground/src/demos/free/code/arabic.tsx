/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web Code: the code keeps its left-to-right order inside an Arabic sentence.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (gap build, owner approval 2026-10-31).
 */
import { Code, Text, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CODE_KEYS } from "#src/demos/free/code/code-keys.constant";

/** The demo's keys. */
const K = CODE_KEYS.code.arabic;

/** Code is never translated. */
const CHECK = "pnpm gen --check";

/** Code: left to right inside an Arabic sentence. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Text lang="ar">
      {t(K.before)} <Code>{CHECK}</Code> {t(K.after)}
    </Text>
  );
}
