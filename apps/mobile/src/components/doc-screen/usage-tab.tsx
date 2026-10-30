/**
 * Stackra file contract:
 * Purpose: the Usage tab of the mobile component screen: the import block, the anatomy of a compound component, then
 *          one section per registry example with the live demo and its source behind a "Show code" accordion. The
 *          `example` param (from "View code" on the preview) scrolls to that example with its code open.
 * Boundary: presentation only; the demos and sources come from the generated map, the words from the catalogues.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (rows 3 to 6) and section 3.3 (Usage).
 */
import type { I18nKey } from "@stackra/i18n";
import { componentKeys, importLine } from "@stackra/showcase";
import { Accordion, Text, useCatalogueText } from "@stackra/ui/native";
import { useContext, useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import { BottomTabBarHeightContext } from "react-native-bottom-tabs";

import { CodeBlock } from "#src/components/doc-screen/code-block";
import { ImportBlock } from "#src/components/doc-screen/import-block";
import type { UsageTabProps } from "#src/components/doc-screen/usage-tab.props";
import { Section } from "#src/components/ui/section";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import { nativeExamples } from "#src/functions/native-examples.function";

/** The showcase chrome's keys. */
const K = SHOWCASE_KEYS.showcase;

/** The compound skeleton: the root part around one line per child part. */
function anatomy(parts: readonly string[]): string {
  const [root, ...children] = parts;
  return [`<${root}>`, ...children.map((part) => `  <${part} />`), `</${root}>`].join("\n");
}

/** Import, anatomy and one section per example. */
export function UsageTab({ entry, demos, example }: UsageTabProps) {
  const t = useCatalogueText(MESSAGES.en);
  // Clear the floating tab bar: the last section scrolls fully above it (0 outside the tab navigator).
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const keys = componentKeys(entry);
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});

  // Scroll to the example "View code" asked for once its section has laid out.
  useEffect(() => {
    const y = example ? offsets.current[example] : undefined;
    if (y !== undefined) scroll.current?.scrollTo({ y, animated: true });
  }, [example]);

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: tabBar + 32 }}
      ref={scroll}
      contentContainerClassName="gap-6 p-4"
    >
      <Section title={t(K.section.import)}>
        <ImportBlock line={importLine(entry, "native")} />
      </Section>
      {entry.parts.length > 1 ? (
        <Section title={t(K.section.anatomy)}>
          <CodeBlock code={anatomy(entry.parts)} />
        </Section>
      ) : null}
      {nativeExamples(entry).map((item) => {
        const demo = demos?.examples[item.id];
        const words = keys.examples[item.id];
        return (
          <View
            key={item.id}
            onLayout={(event) => {
              offsets.current[item.id] = event.nativeEvent.layout.y;
            }}
          >
            <Section title={words ? t(words.title as I18nKey) : item.id}>
              {demo ? (
                <>
                  <demo.Demo />
                  <Accordion
                    defaultExpandedKeys={example === item.id ? ["code"] : []}
                    items={[
                      {
                        id: "code",
                        title: t(K.ui.show_code),
                        content: <CodeBlock code={demo.code} />,
                      },
                    ]}
                  />
                </>
              ) : (
                <Text tone="muted">{t(K.ui.planned_note)}</Text>
              )}
            </Section>
          </View>
        );
      })}
    </ScrollView>
  );
}
