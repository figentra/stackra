/**
 * Stackra file contract:
 * Purpose: the Hooks tab of the mobile component screen, shown only when the ApiDoc has hooks: one card per hook with
 *          its signature as code and its return value as prop cards.
 * Boundary: presentation only; the data is the generated ApiDoc.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 9, `## Hooks → Return value`).
 */
import { Card, Heading, Separator, useCatalogueText } from "@stackra/ui/native";
import { Fragment, useContext } from "react";
import { ScrollView, View } from "react-native";
import { BottomTabBarHeightContext } from "react-native-bottom-tabs";

import { CodeBlock } from "#src/components/doc-screen/code-block";
import type { HooksTabProps } from "#src/components/doc-screen/hooks-tab.props";
import { PropCard } from "#src/components/doc-screen/prop-card";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The hooks and their return values. */
export function HooksTab({ hooks, entryKey }: HooksTabProps) {
  // Clear the floating tab bar: the last card scrolls fully above it (0 outside the tab navigator).
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const t = useCatalogueText(MESSAGES.en);
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: tabBar + 32 }}
      contentContainerClassName="gap-4 p-4"
    >
      {hooks.map((hook) => (
        <Card key={hook.name}>
          <Card.Header>
            <Card.Title>{hook.name}</Card.Title>
          </Card.Header>
          <Card.Content className="gap-3">
            <CodeBlock code={hook.signature} />
            <Heading level={3} type="h6">
              {t(SHOWCASE_KEYS.showcase.api.return_value)}
            </Heading>
            <View>
              {hook.returns.map((prop, index) => (
                <Fragment key={prop.name}>
                  {index > 0 ? <Separator /> : null}
                  <PropCard prop={prop} entryKey={entryKey} part={hook.name} hasDefault={false} />
                </Fragment>
              ))}
            </View>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}
