/**
 * Stackra file contract:
 * Purpose: the native `MorphTabs` compound on HeroUI Native Pro's MorphTabs (tab pills that morph as pages swipe):
 *          `MorphTabs.List` (the tablist) names itself from `label` as the accessibility label; the root, with its
 *          imperative `ref` (`goTo`), and every other part (Trigger, TriggerBackground, Icon, Label, Pager, Content)
 *          are HeroUI Native Pro's own; the `useMorphTabs` and `useMorphTabsTrigger` hooks come with it.
 * Boundary: no behaviour or styling of its own. The root is a thin function so the compound never changes HeroUI
 *          Native Pro's own component. The pager needs `react-native-pager-view`. Imports the `morph-tabs` subpath.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */
import { MorphTabs as HeroMorphTabs } from "heroui-native-pro/morph-tabs";
import type { ComponentPropsWithRef, ReactElement } from "react";

import type { MorphTabsListContractProps } from "#contracts/types/morph-tabs-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the native MorphTabs: HeroUI Native Pro's own root props, the imperative `ref` included. */
export type MorphTabsProps = ComponentPropsWithRef<typeof HeroMorphTabs>;

/** The root: HeroUI Native Pro's, which owns the selected value and the pager position; its `ref` passes through. */
function MorphTabsRoot(props: MorphTabsProps): ReactElement {
  return <HeroMorphTabs {...props} />;
}

/**
 * Props of `MorphTabs.List`: the shared contract plus HeroUI Native Pro's own, with `accessibilityLabel` renamed
 * `label`.
 */
export type MorphTabsListProps = MorphTabsListContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroMorphTabs.List>,
    keyof MorphTabsListContractProps | "accessibilityLabel" | "aria-label"
  >;

/** The row of tab pills, the tablist: HeroUI Native Pro's, named by `label`. */
function MorphTabsList({ label, ...rest }: MorphTabsListProps): ReactElement {
  return <HeroMorphTabs.List {...rest} {...omitUndefined({ accessibilityLabel: label })} />;
}

/** The parts of the compound, typed from HeroUI Native Pro's own so the declaration output can name them. */
interface MorphTabsParts {
  /** The header row that holds the triggers, named by `label`. */
  readonly List: typeof MorphTabsList;
  /** A pill that selects its page and grows while selected. */
  readonly Trigger: typeof HeroMorphTabs.Trigger;
  /** An optional themed background behind a pill. */
  readonly TriggerBackground: typeof HeroMorphTabs.TriggerBackground;
  /** An optional icon of a trigger. */
  readonly Icon: typeof HeroMorphTabs.Icon;
  /** An optional label of a trigger, revealed as the pill grows. */
  readonly Label: typeof HeroMorphTabs.Label;
  /** The swipeable pager that holds the pages. */
  readonly Pager: typeof HeroMorphTabs.Pager;
  /** One page of the pager. */
  readonly Content: typeof HeroMorphTabs.Content;
}

/**
 * Tab pills that morph as the pages swipe: `MorphTabs.List` holds a `MorphTabs.Trigger` per page, and
 * `MorphTabs.Pager` holds the `MorphTabs.Content` pages. Name the tab list for screen readers with `label`.
 */
export const MorphTabs: typeof MorphTabsRoot & MorphTabsParts = Object.assign(MorphTabsRoot, {
  List: MorphTabsList,
  Trigger: HeroMorphTabs.Trigger,
  TriggerBackground: HeroMorphTabs.TriggerBackground,
  Icon: HeroMorphTabs.Icon,
  Label: HeroMorphTabs.Label,
  Pager: HeroMorphTabs.Pager,
  Content: HeroMorphTabs.Content,
});

export { useMorphTabs, useMorphTabsTrigger } from "heroui-native-pro/morph-tabs";
