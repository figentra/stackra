/**
 * Stackra file contract:
 * Purpose: the Import section of the Usage tab: the entry's import line as code with a "Copy import" button that
 *          hands the line to the system share sheet (whose actions include Copy) and plays the success haptic.
 * Boundary: presentation and the share call only.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 3) and section 8 (haptics map).
 */
import { Button, useCatalogueText, useHaptic } from "@stackra/ui/native";
import { Share, View } from "react-native";

import { CodeBlock } from "#src/components/doc-screen/code-block";
import type { ImportBlockProps } from "#src/components/doc-screen/import-block.props";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The showcase chrome's keys. */
const K = SHOWCASE_KEYS.showcase.ui;

/** The import line with its copy button. */
export function ImportBlock({ line }: ImportBlockProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { play } = useHaptic();
  // shortcut: no clipboard module is installed, so the share sheet (which offers Copy) stands in; swap for
  // `expo-clipboard` once it is in the mobile catalog.
  const copy = () => {
    Share.share({ message: line })
      .then(() => play("success"))
      .catch(() => undefined);
  };
  return (
    <View className="gap-2">
      <CodeBlock code={line} />
      <Button variant="ghost" size="sm" startIcon="copy" onPress={copy}>
        {t(K.copy_import)}
      </Button>
    </View>
  );
}
