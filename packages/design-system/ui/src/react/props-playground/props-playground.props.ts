/**
 * Stackra file contract:
 * Purpose: `PropsPlaygroundProps`, the props of the web `PropsPlayground` in `props-playground.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); ADR 0302 (decision 3); STA-2041.
 */
import type { Theme } from "@stackra/tokens/contracts";
import type { ReactNode } from "react";

import type { PlaygroundControl } from "#contracts/types/playground-control.type";

/** The values of a playground, by prop name. */
type PlaygroundValues = Readonly<Record<string, string | boolean | number>>;

/** Props of the web PropsPlayground. */
export interface PropsPlaygroundProps {
  /** The component's name, shown as the title and the group's spoken name. */
  readonly label: string;
  /** The props people can change, in order. */
  readonly controls: readonly PlaygroundControl[];
  /** Draws the preview from the current values. */
  readonly render: (values: PlaygroundValues) => ReactNode;
  /** The values, for a controlled playground; pair it with `onChange`. */
  readonly values?: PlaygroundValues | undefined;
  /** The starting values of an uncontrolled playground, over each control's own default. */
  readonly defaultValues?: PlaygroundValues | undefined;
  /** Called with every value after each change. */
  readonly onChange?: ((values: PlaygroundValues) => void) | undefined;
  /** Product themes to try live; the preview alone wears the one chosen. */
  readonly brands?:
    | readonly { readonly id: string; readonly label: string; readonly theme: Theme }[]
    | undefined;
  /** Shows the left-to-right and right-to-left switch for the preview. Defaults to true. */
  readonly hasDirection?: boolean | undefined;
  /** The reset button's words. Defaults to "Reset". */
  readonly resetLabel?: string | undefined;
  /** Styles the playground. */
  readonly className?: string | undefined;
}
