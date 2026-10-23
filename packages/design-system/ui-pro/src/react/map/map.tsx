/**
 * Stackra file contract:
 * Purpose: the web `Map` compound on HeroUI Pro's Map: the map root, which maps the contract's `label` to
 *          `aria-label`, the parts Marker and Route, which map `onPress` to HeroUI Pro's `onClick`, and every other
 *          HeroUI Pro part (controls, markers, popups, arcs and clusters) as HeroUI Pro has it; `useMap` is
 *          re-exported.
 * Boundary: no styling or behaviour of its own; the look needs `@heroui-pro/react/css`. The map draws with
 *          `maplibre-gl`, a peer, and needs WebGL. The compound exposes the documented parts: HeroUI Pro's
 *          `Map.Root` is left out. Imports the `map` subpath, the only way to reach it. The name `Map` shadows the
 *          global `Map` in this file, as it does in HeroUI Pro's own.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import {
  Map as HeroMap,
  type MapMarkerProps as HeroMapMarkerProps,
  type MapRootProps,
  type MapRouteProps as HeroMapRouteProps,
} from "@heroui-pro/react/map";

import type {
  MapContractProps,
  MapMarkerContractProps,
  MapRouteContractProps,
} from "#contracts/types/map-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the web Map: the shared contract plus HeroUI Pro's own map props, with `aria-label` renamed `label`. */
export type MapProps = MapContractProps & Omit<MapRootProps, keyof MapContractProps | "aria-label">;

/** Props of `Map.Marker`: the shared contract plus HeroUI Pro's own, with `onClick` renamed `onPress`. */
export type MapMarkerProps = MapMarkerContractProps &
  Omit<HeroMapMarkerProps, keyof MapMarkerContractProps | "onClick">;

/** Props of `Map.Route`: the shared contract plus HeroUI Pro's own, with `onClick` renamed `onPress`. */
export type MapRouteProps = MapRouteContractProps &
  Omit<HeroMapRouteProps, keyof MapRouteContractProps | "onClick">;

/** The map root: HeroUI Pro's, a MapLibre map named by `label`. */
function MapRoot({ label, ...rest }: MapProps) {
  return <HeroMap.Root {...rest} {...omitUndefined({ "aria-label": label })} />;
}

/** A marker at a longitude and latitude, pressed by `onPress`. */
function MapMarker({ onPress, ...rest }: MapMarkerProps) {
  const onClick = onPress === undefined ? undefined : () => onPress();
  return <HeroMap.Marker {...rest} {...omitUndefined({ onClick })} />;
}

/** A line through coordinates, pressed by `onPress` while `interactive`. */
function MapRoute({ onPress, ...rest }: MapRouteProps) {
  const onClick = onPress === undefined ? undefined : () => onPress();
  return <HeroMap.Route {...rest} {...omitUndefined({ onClick })} />;
}

/** The parts of the compound, typed from HeroUI Pro's own so the declaration output can name them. */
interface MapParts {
  /** A marker at a longitude and latitude, pressed by `onPress`. */
  readonly Marker: typeof MapMarker;
  /** The marker's own content, drawn at its position. */
  readonly MarkerContent: typeof HeroMap.MarkerContent;
  /** A coloured dot for a marker. */
  readonly MarkerDot: typeof HeroMap.MarkerDot;
  /** A text label beside a marker. */
  readonly MarkerLabel: typeof HeroMap.MarkerLabel;
  /** A popup that opens from a marker. */
  readonly MarkerPopup: typeof HeroMap.MarkerPopup;
  /** A tooltip that shows on marker hover. */
  readonly MarkerTooltip: typeof HeroMap.MarkerTooltip;
  /** A popup at a longitude and latitude. */
  readonly Popup: typeof HeroMap.Popup;
  /** A line through coordinates, pressed by `onPress`. */
  readonly Route: typeof MapRoute;
  /** Curved lines between pairs of points. */
  readonly Arc: typeof HeroMap.Arc;
  /** Clustered points from GeoJSON. */
  readonly ClusterLayer: typeof HeroMap.ClusterLayer;
  /** The positioned container for map controls. */
  readonly Controls: typeof HeroMap.Controls;
  /** A group of control buttons. */
  readonly ControlGroup: typeof HeroMap.ControlGroup;
  /** A divider inside a control group. */
  readonly ControlSeparator: typeof HeroMap.ControlSeparator;
  /** One control button, named by `label`. */
  readonly ControlButton: typeof HeroMap.ControlButton;
  /** The zoom in and out buttons. */
  readonly ZoomControl: typeof HeroMap.ZoomControl;
  /** The compass button that resets the bearing. */
  readonly CompassControl: typeof HeroMap.CompassControl;
  /** The button that centres the map on the user. */
  readonly LocateControl: typeof HeroMap.LocateControl;
  /** The button that toggles fullscreen. */
  readonly FullscreenControl: typeof HeroMap.FullscreenControl;
}

/** A MapLibre map: `Map.Marker` with its parts, `Map.Route`, `Map.Arc`, `Map.ClusterLayer` and `Map.Controls`. */
export const Map: typeof MapRoot & MapParts = Object.assign(MapRoot, {
  Marker: MapMarker,
  MarkerContent: HeroMap.MarkerContent,
  MarkerDot: HeroMap.MarkerDot,
  MarkerLabel: HeroMap.MarkerLabel,
  MarkerPopup: HeroMap.MarkerPopup,
  MarkerTooltip: HeroMap.MarkerTooltip,
  Popup: HeroMap.Popup,
  Route: MapRoute,
  Arc: HeroMap.Arc,
  ClusterLayer: HeroMap.ClusterLayer,
  Controls: HeroMap.Controls,
  ControlGroup: HeroMap.ControlGroup,
  ControlSeparator: HeroMap.ControlSeparator,
  ControlButton: HeroMap.ControlButton,
  ZoomControl: HeroMap.ZoomControl,
  CompassControl: HeroMap.CompassControl,
  LocateControl: HeroMap.LocateControl,
  FullscreenControl: HeroMap.FullscreenControl,
});

export { useMap } from "@heroui-pro/react/map";
