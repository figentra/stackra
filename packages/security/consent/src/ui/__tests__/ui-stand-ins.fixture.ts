/**
 * Stackra file contract:
 * Purpose: DOM stand-ins for the `@stackra/ui/react` components the `./ui` entry renders, so its tests run in jsdom
 *          without HeroUI: a button, a switch, a link, a heading, a text and a card with its parts.
 * Boundary: test fixture only; each stand-in keeps the props the components under test pass (label, value, read-only,
 *           press) and nothing else.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269.
 */
import { createElement, type ReactNode } from "react";

/** The props the stand-ins read. */
interface StandInProps {
  readonly children?: ReactNode;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly value?: boolean;
  readonly isReadOnly?: boolean;
  readonly isLoading?: boolean;
  readonly href?: string;
  readonly level?: number;
  readonly onPress?: () => void;
  readonly onChange?: (value: boolean) => void;
}

/** A container element that renders its children. */
const box =
  (tag: string) =>
  (props: StandInProps): ReactNode =>
    createElement(tag, null, props.children);

/** The `@stackra/ui/react` module the tests mock in. */
export const UI_STAND_INS = {
  Button: (props: StandInProps) =>
    createElement(
      "button",
      { type: "button", "aria-busy": props.isLoading === true, onClick: () => props.onPress?.() },
      props.children,
    ),
  Switch: (props: StandInProps) =>
    createElement("button", {
      type: "button",
      role: "switch",
      "aria-label": props.label,
      "aria-checked": props.value === true,
      "aria-readonly": props.isReadOnly === true,
      onClick: () => {
        if (props.isReadOnly !== true) props.onChange?.(props.value !== true);
      },
    }),
  Link: (props: StandInProps) => createElement("a", { href: props.href }, props.children),
  Heading: (props: StandInProps) => createElement(`h${props.level ?? 2}`, null, props.children),
  Text: box("p"),
  Card: Object.assign(box("div"), { Content: box("div"), Footer: box("div") }),
};
