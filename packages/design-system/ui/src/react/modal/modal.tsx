/**
 * Stackra file contract:
 * Purpose: the web `Modal` on HeroUI v3's Modal: one root that draws HeroUI's root, backdrop, container and dialog
 *          around the caller's parts, so an app writes `Modal` and its `Header`, `Title`, `Body`, `Footer` and `Close`
 *          and nothing else. It maps the shared contract onto HeroUI (`size`, `position` to HeroUI's `placement`,
 *          `isDismissable` and `isKeyboardDismissDisabled` to the backdrop, `label` to `aria-label`) and passes every
 *          other HeroUI dialog prop through unchanged. `motion` picks the entrance: `slide-up` rises from the bottom
 *          edge, `stick-top` drops from the top and stays flush with it, `slide-side` slides in from the inline-end side
 *          as a full-height panel (logical `end`, so it is the left in right-to-left).
 * Boundary: no styling of its own beyond the motion classes (tw-animate's, which HeroUI's styles already ship); at the
 *           `reduced` motion level a motion becomes a fade, at `none` nothing plays; the look is HeroUI's, themed by `@stackra/tokens`. React Aria traps focus in the
 *           dialog, hides the page behind it from assistive technology and returns focus to the element that opened
 *           it. A footer button with `slot="close"` closes the modal without any state. A route-bound modal and the
 *           stack of overlays are `@stackra/navigation`'s.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0312; ADR 0165 (HeroUI v3 on web); owner
 *          decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.2, 2.4.3 and 4.1.2.
 */
/* oxlint-disable react/only-export-components -- the compound is Object.assign(Root, parts), so the export is the
   root function, which React Refresh takes as a component; the boundary holds (rule-gap B-6). */
import { Modal as HeroModal } from "@heroui/react";
import type { ReactElement } from "react";

import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import type { OverlayMotion } from "#contracts/enums/overlay-motion.enum";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { ModalClose } from "#react/modal/modal-close";
import { ModalTitle } from "#react/modal/modal-title";
import type { ModalProps } from "#react/modal/modal.props";
import { useMotion } from "#react/design-system-provider/use-motion";
import { ModalEscapeContext } from "#react/modal/modal-escape-context";

/** Where each motion sits: HeroUI's placement, and the container's and the dialog's classes. */
const LAYOUT: Readonly<
  Record<OverlayMotion, { placement: "top" | "bottom"; container: string; dialog: string }>
> = {
  "slide-up": { placement: "bottom", container: "", dialog: "" },
  "stick-top": {
    placement: "top",
    container: "pt-0 sm:pt-0",
    dialog: "rounded-t-none",
  },
  "slide-side": {
    placement: "top",
    container: "ms-auto h-full items-stretch p-0 sm:w-auto sm:p-0",
    dialog: "h-full max-h-none rounded-e-none sm:min-w-96",
  },
};

/** The entrance and exit of each motion at the full level: a full slide in place of HeroUI's zoom. */
const SLIDE: Readonly<Record<OverlayMotion, string>> = {
  "slide-up":
    "data-[entering=true]:zoom-in-100 data-[entering=true]:slide-in-from-bottom-full data-[exiting=true]:zoom-out-100 data-[exiting=true]:slide-out-to-bottom-full data-[entering=true]:duration-300",
  "stick-top":
    "data-[entering=true]:zoom-in-100 data-[entering=true]:slide-in-from-top-full data-[exiting=true]:zoom-out-100 data-[exiting=true]:slide-out-to-top-full data-[entering=true]:duration-300",
  "slide-side":
    "data-[entering=true]:zoom-in-100 data-[entering=true]:slide-in-from-end data-[exiting=true]:zoom-out-100 data-[exiting=true]:slide-out-to-end data-[entering=true]:duration-300",
};

/** The motion classes of the container at a motion level. */
function motionClassName(motion: OverlayMotion, level: MotionLevel): string {
  if (level === "none") return "data-[entering=true]:animate-none data-[exiting=true]:animate-none";
  if (level === "reduced")
    return "data-[entering=true]:zoom-in-100 data-[entering=true]:slide-in-from-top-0 data-[entering=true]:slide-in-from-bottom-0 data-[exiting=true]:zoom-out-100";
  return SLIDE[motion];
}

/** The modal root: HeroUI's root, backdrop, container and dialog in one, holding the caller's parts. */
function ModalRoot({
  children,
  trigger,
  isOpen,
  defaultOpen,
  onOpenChange,
  isDismissable,
  isKeyboardDismissDisabled,
  size,
  position,
  motion,
  label,
  className,
  ...rest
}: ModalProps): ReactElement {
  const level = useMotion();
  const layout = motion ? LAYOUT[motion] : undefined;
  return (
    <HeroModal.Root {...omitUndefined({ isOpen, defaultOpen, onOpenChange })}>
      {trigger}
      <HeroModal.Backdrop {...omitUndefined({ isDismissable, isKeyboardDismissDisabled })}>
        <HeroModal.Container
          {...omitUndefined({ size, placement: layout?.placement ?? position })}
          {...(motion && layout
            ? { className: `${layout.container} ${motionClassName(motion, level)}` }
            : {})}
        >
          <HeroModal.Dialog
            {...rest}
            {...(layout || className
              ? { className: [layout?.dialog, className].filter(Boolean).join(" ") }
              : {})}
            {...(label ? { "aria-label": label } : {})}
          >
            <ModalEscapeContext value={!isKeyboardDismissDisabled}>{children}</ModalEscapeContext>
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal.Root>
  );
}

/** The parts of the compound, typed from HeroUI's own so the declaration output can name them. */
interface ModalParts {
  /** The header: a column for the title. */
  readonly Header: typeof HeroModal.Header;
  /** The title, a heading placed in the outline by its `level`, which also names the dialog. */
  readonly Title: typeof ModalTitle;
  /** The body, which scrolls inside the dialog when the content is long. */
  readonly Body: typeof HeroModal.Body;
  /** The footer: a row for actions. */
  readonly Footer: typeof HeroModal.Footer;
  /** The close button in the corner, named by its required `label`. */
  readonly Close: typeof ModalClose;
}

/**
 * A modal dialog: a centred panel over a backdrop that blocks the page until it closes. Open it from a `trigger`, or
 * drive it with `isOpen` and `onOpenChange`; fill it with `Modal.Header`, `Modal.Title`, `Modal.Body`, `Modal.Footer`
 * and `Modal.Close`.
 */
export const Modal: typeof ModalRoot & ModalParts = Object.assign(ModalRoot, {
  Header: HeroModal.Header,
  Title: ModalTitle,
  Body: HeroModal.Body,
  Footer: HeroModal.Footer,
  Close: ModalClose,
});
