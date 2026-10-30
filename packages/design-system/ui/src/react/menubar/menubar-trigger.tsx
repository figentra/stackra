/**
 * Stackra file contract:
 * Purpose: `MenubarTrigger`, one top-level item of the Menubar: a `menuitem` button that takes React Aria's menu
 *          trigger props (open on press, Down or Up, `aria-haspopup`, `aria-expanded`) through the press responder its
 *          Dropdown provides, holds the bar's one tab stop when it is the current item, and shows a focus ring.
 * Boundary: a plain button on React Aria's `usePress` and `useFocusRing`: React Aria's Button drops `role`, and the
 *           menubar pattern needs `menuitem`. The bar owns the arrow keys between items.
 * Runtime: browser
 * Governing contract: WAI-ARIA menubar pattern; WCAG 2.2 SC 2.1.1, 2.4.7 and 4.1.2; STA-1371 (wave D).
 */
import { cn } from "@heroui/react";
import { useRef, type KeyboardEvent, type ReactElement } from "react";
import { mergeProps, useFocusRing, usePress } from "react-aria";

/** A menubar's top-level item. */
export function MenubarTrigger({
  label,
  isTabStop,
  isOpen,
  register,
  onKeyDown,
}: {
  readonly label: string;
  readonly isTabStop: boolean;
  readonly isOpen: boolean;
  readonly register: (element: HTMLButtonElement | null) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}): ReactElement {
  const ref = useRef<HTMLButtonElement | null>(null);
  const { pressProps } = usePress({ ref });
  const { focusProps, isFocusVisible } = useFocusRing();
  return (
    <button
      {...mergeProps(pressProps, focusProps, { onKeyDown })}
      ref={(element) => {
        ref.current = element;
        register(element);
      }}
      type="button"
      role="menuitem"
      tabIndex={isTabStop ? 0 : -1}
      data-open={isOpen || undefined}
      style={{ borderRadius: "var(--radius-control)" }}
      className={cn(
        "px-3 py-1.5 text-sm font-medium text-foreground outline-none select-none hover:bg-default",
        isOpen && "bg-default",
        isFocusVisible && "outline-2 outline-focus",
      )}
    >
      {label}
    </button>
  );
}
