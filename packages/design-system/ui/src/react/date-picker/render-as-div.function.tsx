/**
 * Stackra file contract:
 * Purpose: `renderAsDiv`, the render function that draws a web calendar header as a `div`.
 * Boundary: a render function only.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { CalendarHeaderProps } from "@heroui/react";
import type { ComponentProps } from "react";

/** Draws a calendar header as a `div`: inside React Aria's `application` calendar a `header` is a banner landmark. */
// A cast: HeroUI types the props for the `header` element it would draw, and a `div` takes the same attributes.
export const renderAsDiv: NonNullable<CalendarHeaderProps["render"]> = (props) => (
  <div {...(props as unknown as ComponentProps<"div">)} />
);
