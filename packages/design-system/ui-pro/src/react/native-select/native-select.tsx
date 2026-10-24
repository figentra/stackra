/**
 * Stackra file contract:
 * Purpose: the web `NativeSelect` compound on HeroUI Pro's NativeSelect (a styled browser `select`): the root maps
 *          `isFullWidth` to `fullWidth`; the trigger maps `label` and `isDisabled`; the `variant` and every other prop
 *          pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `NativeSelect.Root` is left out. Imports the `native-select` subpath. The
 *          component's name is HeroUI Pro's; it is a web component, unrelated to the `native` entry of this package.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  NativeSelect as HeroNativeSelect,
  type NativeSelectProps as HeroNativeSelectProps,
} from "@heroui-pro/react/native-select";

import type { NativeSelectContractProps } from "#contracts/types/native-select-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { NativeSelectTrigger } from "#react/native-select/native-select-trigger";

/** Props of the web NativeSelect: the shared contract plus HeroUI Pro's own, with `fullWidth` renamed `isFullWidth`. */
export type NativeSelectProps = NativeSelectContractProps &
  Omit<HeroNativeSelectProps, keyof NativeSelectContractProps | "fullWidth">;

/** The root: HeroUI Pro's wrapper of the trigger and its indicator. */
function NativeSelectRoot({ isFullWidth, ...rest }: NativeSelectProps) {
  return <HeroNativeSelect.Root {...rest} {...omitUndefined({ fullWidth: isFullWidth })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface NativeSelectParts {
  /** The `select` element; named by `label`, disabled by `isDisabled`. */
  readonly Trigger: typeof NativeSelectTrigger;
  /** The chevron drawn beside the select. */
  readonly Indicator: typeof HeroNativeSelect.Indicator;
  /** One option of the select. */
  readonly Option: typeof HeroNativeSelect.Option;
  /** A headed group of options. */
  readonly OptGroup: typeof HeroNativeSelect.OptGroup;
}

/** A styled browser select: `NativeSelect.Trigger` holds `NativeSelect.Option` and `NativeSelect.OptGroup`. */
export const NativeSelect: typeof NativeSelectRoot & NativeSelectParts = Object.assign(
  NativeSelectRoot,
  {
    Trigger: NativeSelectTrigger,
    Indicator: HeroNativeSelect.Indicator,
    Option: HeroNativeSelect.Option,
    OptGroup: HeroNativeSelect.OptGroup,
  },
);
