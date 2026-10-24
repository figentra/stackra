/**
 * Stackra file contract:
 * Purpose: the web `InlineSelect` compound on HeroUI Pro's InlineSelect (a dropdown that blends into surrounding text):
 *          the root maps `label` to `aria-label`; `value`, `onChange` and every other prop pass through.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The compound exposes the
 *          documented parts: HeroUI Pro's `InlineSelect.Root` is left out. Imports the `inline-select` subpath.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  InlineSelect as HeroInlineSelect,
  type InlineSelectProps as HeroInlineSelectProps,
} from "@heroui-pro/react/inline-select";

import type { InlineSelectContractProps } from "#contracts/types/inline-select-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web InlineSelect: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type InlineSelectProps<
  T extends object = object,
  M extends "single" | "multiple" = "single",
> = InlineSelectContractProps &
  Omit<HeroInlineSelectProps<T, M>, keyof InlineSelectContractProps | "aria-label">;

/** The root: HeroUI Pro's, with `label` as the accessible name. */
function InlineSelectRoot<T extends object = object, M extends "single" | "multiple" = "single">({
  label,
  isDisabled,
  ...rest
}: InlineSelectProps<T, M>) {
  return (
    <HeroInlineSelect.Root<T, M>
      {...(rest as HeroInlineSelectProps<T, M>)}
      {...omitUndefined({ isDisabled, "aria-label": label })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface InlineSelectParts {
  /** The pressable text that holds the value and the indicator. */
  readonly Trigger: typeof HeroInlineSelect.Trigger;
  /** The text of the selected item, or the placeholder. */
  readonly Value: typeof HeroInlineSelect.Value;
  /** The chevron that shows the popover opens. */
  readonly Indicator: typeof HeroInlineSelect.Indicator;
  /** The popover that holds the list box. */
  readonly Popover: typeof HeroInlineSelect.Popover;
}

/**
 * A dropdown that blends into surrounding text: `InlineSelect.Trigger` holds `InlineSelect.Value` and
 * `InlineSelect.Indicator`, and `InlineSelect.Popover` holds the list box. Name it for screen readers with `label`.
 */
export const InlineSelect: typeof InlineSelectRoot & InlineSelectParts = Object.assign(
  InlineSelectRoot,
  {
    Trigger: HeroInlineSelect.Trigger,
    Value: HeroInlineSelect.Value,
    Indicator: HeroInlineSelect.Indicator,
    Popover: HeroInlineSelect.Popover,
  },
);
