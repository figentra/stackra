/**
 * Stackra file contract:
 * Purpose: the web `ActionBar` compound on HeroUI Pro's ActionBar: the floating toolbar root, which maps the
 *          contract's `label` to `aria-label`, and the parts Prefix, Content and Suffix.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. `isOpen` is HeroUI Pro's
 *          and drives the enter and exit animation. The compound exposes the documented parts: HeroUI Pro's
 *          `ActionBar.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import { ActionBar as HeroActionBar, type ActionBarRootProps } from "@heroui-pro/react/action-bar";

import type { ActionBarContractProps } from "#contracts/types/action-bar-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web ActionBar: the shared contract plus HeroUI Pro's own toolbar props, with `aria-label` renamed
 * `label`.
 */
export type ActionBarProps = ActionBarContractProps &
  Omit<ActionBarRootProps, keyof ActionBarContractProps | "aria-label">;

/** The toolbar root: HeroUI Pro's, named by `label`, visible while `isOpen`. */
function ActionBarRoot({ label, ...rest }: ActionBarProps) {
  return <HeroActionBar.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ActionBarParts {
  /** The leading area, usually a selection count. */
  readonly Prefix: typeof HeroActionBar.Prefix;
  /** The main area, holding the action buttons. */
  readonly Content: typeof HeroActionBar.Content;
  /** The trailing area, usually a clear button. */
  readonly Suffix: typeof HeroActionBar.Suffix;
}

/** A floating toolbar for contextual actions: `ActionBar.Prefix`, `ActionBar.Content`, `ActionBar.Suffix`. */
export const ActionBar: typeof ActionBarRoot & ActionBarParts = Object.assign(ActionBarRoot, {
  Prefix: HeroActionBar.Prefix,
  Content: HeroActionBar.Content,
  Suffix: HeroActionBar.Suffix,
});
