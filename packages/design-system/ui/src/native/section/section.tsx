/**
 * Stackra file contract:
 * Purpose: the native `Section`, an adapted form: a titled card on a screen, a group named by its title (or by `label`),
 *          holding the title as a heading with a muted line under it, the section's `actions` and its body. `actions`
 *          is an ordered list: the first is the primary button, the next two secondary buttons and the rest go in an
 *          ActionMenu named by `moreActionsLabel`; `startContent` leads the title and `endContent` follows the actions.
 * Boundary: HeroUI Native has no section, so this is the earlier wave's `Card` (HeroUI Native's) with its header,
 *           title, description and body, and it imports no sibling piece of wave 6 (ADR 0314 decision 4). React Native
 *           reports no heading levels, so `headingLevel` reaches the card title and is dropped there. The card is a
 *           `group` whose accessible name is `label`, or the title when that is a string; a title that is not a string
 *           names the group only through the heading inside it, so pass `label` then. A string or number in
 *           `startContent` or the body is drawn inside `Text`, since React Native refuses a bare string in a `View`.
 *           Extra props pass to the card.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3, adapted forms); ADR 0303 (decision 7); ADR 0314 (decisions 1, 4 and 7); WCAG
 *          2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";

import type { SectionContractProps } from "#contracts/types/section-contract-props.type";
import { Card, type CardProps } from "#native/card/card";
import { PageActions } from "#native/page-actions/page-actions";
import { Text } from "#native/text/text";

// shortcut: English until @stackra/i18n ships; then the key `ui::section.more-actions`.
const STRINGS = { moreActions: "More actions" } as const;

/**
 * Props of the native Section: the shared contract plus the card's own props, passed through. The card's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type SectionProps = SectionContractProps &
  Omit<CardProps, keyof SectionContractProps | "accessibilityLabel">;

/** A node as the section can draw it: a string or number goes inside `Text`, any other node as it is. */
function textual(node: ReactNode): ReactNode {
  return typeof node === "string" || typeof node === "number" ? <Text>{node}</Text> : node;
}

/** A titled card: title and description, actions and a body. Draw one per block of a screen. */
export function Section({
  title,
  description,
  headingLevel = 2,
  actions,
  moreActionsLabel = STRINGS.moreActions,
  startContent,
  endContent,
  label,
  children,
  ...rest
}: SectionProps): ReactElement {
  const name = label ?? (typeof title === "string" ? title : undefined);
  return (
    <Card role="group" {...(name ? { accessibilityLabel: name } : {})} {...rest}>
      <Card.Header>
        <View className="flex-row flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <View className="min-w-0 flex-1 flex-row items-start gap-3">
            {textual(startContent)}
            <View className="min-w-0 flex-1 gap-1">
              <Card.Title level={headingLevel}>{title}</Card.Title>
              {description == null ? null : <Card.Description>{description}</Card.Description>}
            </View>
          </View>
          <PageActions
            actions={actions ?? []}
            moreActionsLabel={moreActionsLabel}
            endContent={endContent}
            size="sm"
          />
        </View>
      </Card.Header>
      {children == null ? null : <Card.Content>{textual(children)}</Card.Content>}
    </Card>
  );
}
