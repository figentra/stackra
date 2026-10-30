/**
 * Stackra file contract:
 * Purpose: the API tab of the mobile component screen: one card per part in registry order (`<Part> Props`, what it
 *          extends), its props as prop cards, then the render props (no default), the events and the native
 *          animation options as sub-lists; a machine-translation mark when the Arabic overlay is machine-written.
 * Boundary: presentation only; the data is the generated ApiDoc. Hooks have their own tab.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 9) and section 3.3 (API).
 */
import type { ApiProp } from "@stackra/showcase";
import { Card, Heading, Separator, Text, useCatalogueText } from "@stackra/ui/native";
import { Fragment, useContext } from "react";
import { ScrollView, View } from "react-native";
import { BottomTabBarHeightContext } from "react-native-bottom-tabs";

import type { ApiTabProps } from "#src/components/doc-screen/api-tab.props";
import { PropCard } from "#src/components/doc-screen/prop-card";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The API words' keys. */
const K = SHOWCASE_KEYS.showcase.api;

/** The props of one group, separated by rules. */
function PropList({
  props,
  entryKey,
  part,
  hasDefault = true,
}: {
  readonly props: readonly ApiProp[];
  readonly entryKey: string;
  readonly part: string;
  readonly hasDefault?: boolean;
}) {
  return (
    <View>
      {props.map((prop, index) => (
        <Fragment key={prop.name}>
          {index > 0 ? <Separator /> : null}
          <PropCard prop={prop} entryKey={entryKey} part={part} hasDefault={hasDefault} />
        </Fragment>
      ))}
    </View>
  );
}

/** The parts' props, render props, events and animation options. */
export function ApiTab({ api }: ApiTabProps) {
  // Clear the floating tab bar: the last card scrolls fully above it (0 outside the tab navigator).
  const tabBar = useContext(BottomTabBarHeightContext) ?? 0;
  const t = useCatalogueText(MESSAGES.en);
  if (!api) {
    return (
      <Text tone="muted" className="p-4">
        {t(SHOWCASE_KEYS.showcase.ui.planned_note)}
      </Text>
    );
  }
  const groups = [
    { id: "renderProps", title: K.render_props, hasDefault: false },
    { id: "events", title: K.events, hasDefault: true },
    { id: "animation", title: K.animation, hasDefault: true },
  ] as const;
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: tabBar + 32 }}
      contentContainerClassName="gap-4 p-4"
    >
      {api.parts.map((part) => (
        <Card key={part.name}>
          <Card.Header>
            <Card.Title>{t(K.props_of, { part: part.name })}</Card.Title>
            {part.extends ? (
              <Card.Description>{t(K.extends, { base: part.extends })}</Card.Description>
            ) : null}
          </Card.Header>
          <Card.Content className="gap-3">
            <PropList props={part.props} entryKey={api.key} part={part.name} />
            {groups.map(({ id, title, hasDefault }) => {
              const props = part[id];
              if (!props || props.length === 0) return null;
              return (
                <View key={id} className="gap-1">
                  <Heading level={3} type="h6">
                    {t(title)}
                  </Heading>
                  <PropList
                    props={props}
                    entryKey={api.key}
                    part={part.name}
                    hasDefault={hasDefault}
                  />
                </View>
              );
            })}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}
