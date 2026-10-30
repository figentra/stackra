/**
 * Stackra file contract:
 * Purpose: `contentWidthClassName`: the class a text field gets when `isFullWidth` is false. HeroUI's `fullWidth={false}`
 *          only leaves out `w-full`, so in a grid or a column, which stretch their children, the field still spans the
 *          row; `w-fit` keeps it at its content width. TextField, TextArea and InputGroup share it.
 * Boundary: pure; keeps the caller's class, a string or React Aria's render function, after `w-fit`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7: `isFullWidth`).
 */
import type { TextFieldRootProps } from "@heroui/react";

/** `className` with `w-fit` in front of it. */
export function contentWidthClassName(
  className: TextFieldRootProps["className"],
): NonNullable<TextFieldRootProps["className"]> {
  if (typeof className === "function") return (state) => `w-fit ${className(state)}`;
  return className ? `w-fit ${className}` : "w-fit";
}
