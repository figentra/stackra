/**
 * Stackra file contract:
 * Purpose: the web `Resizable` compound on HeroUI Pro's Resizable (panels split by draggable handles):
 *          `Resizable.Handle` names its separator from `label` and maps `isDisabled` to HeroUI Pro's `disabled`; the
 *          root and the Panel and Indicator parts are HeroUI Pro's own.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. Resizable is reachable only
 *          through the `resizable` subpath, which this imports. The root is a thin function so the compound never
 *          changes HeroUI Pro's own component. The compound exposes the documented parts: HeroUI Pro's
 *          `Resizable.Root` is left out.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import { Resizable as HeroResizable } from "@heroui-pro/react/resizable";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ResizableProps } from "#react/resizable/resizable.props";
import type { ResizableHandleProps } from "#react/resizable/resizable-handle.props";

/** The root: HeroUI Pro's, a group of panels that holds the layout. */
function ResizableRoot(props: ResizableProps) {
  return <HeroResizable.Root {...props} />;
}

/** The handle between two panels: HeroUI Pro's, named by `label`. */
function ResizableHandle({ label, isDisabled, ...rest }: ResizableHandleProps) {
  return (
    <HeroResizable.Handle
      {...rest}
      {...omitUndefined({ "aria-label": label, disabled: isDisabled })}
    />
  );
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface ResizableParts {
  /** One panel, sized by `defaultSize`, `minSize` and `maxSize`. */
  readonly Panel: typeof HeroResizable.Panel;
  /** The draggable separator between two panels, named by `label`. */
  readonly Handle: typeof ResizableHandle;
  /** A custom grip drawn inside a handle. */
  readonly Indicator: typeof HeroResizable.Indicator;
}

/** Panels split by draggable handles: `Resizable.Panel`, `Resizable.Handle`, `Resizable.Panel`. */
export const Resizable: typeof ResizableRoot & ResizableParts = Object.assign(ResizableRoot, {
  Panel: HeroResizable.Panel,
  Handle: ResizableHandle,
  Indicator: HeroResizable.Indicator,
});
