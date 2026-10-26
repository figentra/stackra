/**
 * Stackra file contract:
 * Purpose: proves the web Map names its root as a region from `label`, maps `onPress` to HeroUI Pro's `onClick` on a
 *          marker and a route, leaves each absent when not given, passes every other prop through, carries HeroUI
 *          Pro's own parts and `useMap`, and refuses HeroUI Pro's names.
 * Boundary: HeroUI Pro's map is replaced by a recording stand-in, because MapLibre needs WebGL and a layout engine,
 *          neither of which jsdom has. Each stand-in part records its props and renders nothing, so what is checked
 *          is exactly what reaches HeroUI Pro.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-005
import * as heroMap from "@heroui-pro/react/map";
import { render } from "@testing-library/react";

import { Map, useMap } from "#react/map/map";
import type { MapMarkerProps } from "#react/map/map-marker.props";
import type { MapProps } from "#react/map/map.props";
import type { MapRouteProps } from "#react/map/map-route.props";

const { seen, recording } = vi.hoisted(() => {
  const calls = { Root: [], Marker: [], Route: [] } as Record<string, Record<string, unknown>[]>;
  // A stand-in part: records the props that reach HeroUI Pro and renders nothing.
  const record = (name: string) => (props: Record<string, unknown>) => {
    calls[name]?.push(props);
    return null;
  };
  return { seen: calls, recording: record };
});

vi.mock("@heroui-pro/react/map", () => {
  const names = [
    "Root",
    "Marker",
    "Route",
    "MarkerContent",
    "MarkerDot",
    "MarkerLabel",
    "MarkerPopup",
    "MarkerTooltip",
    "Popup",
    "Arc",
    "ClusterLayer",
    "Controls",
    "ControlGroup",
    "ControlSeparator",
    "ControlButton",
    "ZoomControl",
    "CompassControl",
    "LocateControl",
    "FullscreenControl",
  ];
  return {
    Map: Object.fromEntries(names.map((name) => [name, recording(name)])),
    useMap: () => ({ isLoaded: false, map: null }),
  };
});

describe("Map (web)", () => {
  beforeEach(() => {
    for (const calls of Object.values(seen)) calls.length = 0;
  });

  it("names the root as a region from label, and passes every other prop through", () => {
    render(<Map label="Depots" isLoading mapStyle="https://example.test/style.json" />);
    expect(seen["Root"]?.at(-1)).toEqual({
      role: "region",
      "aria-label": "Depots",
      isLoading: true,
      mapStyle: "https://example.test/style.json",
    });
    render(<Map />);
    expect("aria-label" in (seen["Root"]?.at(-1) ?? {})).toBe(false);
    expect("label" in (seen["Root"]?.at(-1) ?? {})).toBe(false);
    expect("role" in (seen["Root"]?.at(-1) ?? {})).toBe(false);
  });

  it("maps a marker's onPress to HeroUI Pro's onClick, without the pointer event", () => {
    const onPress = vi.fn();
    render(<Map.Marker latitude={1} longitude={2} draggable onPress={onPress} />);
    const props = seen["Marker"]?.at(-1) ?? {};
    expect(props).toMatchObject({ latitude: 1, longitude: 2, draggable: true });
    expect("onPress" in props).toBe(false);
    (props["onClick"] as (event: MouseEvent) => void)(new MouseEvent("click"));
    expect(onPress).toHaveBeenCalledExactlyOnceWith();
    render(<Map.Marker latitude={1} longitude={2} />);
    expect("onClick" in (seen["Marker"]?.at(-1) ?? {})).toBe(false);
  });

  it("maps a route's onPress to HeroUI Pro's onClick", () => {
    const onPress = vi.fn();
    render(
      <Map.Route
        coordinates={[
          [0, 0],
          [1, 1],
        ]}
        interactive
        onPress={onPress}
      />,
    );
    const props = seen["Route"]?.at(-1) ?? {};
    expect(props).toMatchObject({ interactive: true });
    expect("onPress" in props).toBe(false);
    (props["onClick"] as () => void)();
    expect(onPress).toHaveBeenCalledExactlyOnceWith();
    render(
      <Map.Route
        coordinates={[
          [0, 0],
          [1, 1],
        ]}
      />,
    );
    expect("onClick" in (seen["Route"]?.at(-1) ?? {})).toBe(false);
  });

  it("carries HeroUI Pro's own parts and hook", () => {
    for (const part of [
      "MarkerContent",
      "MarkerDot",
      "MarkerLabel",
      "MarkerPopup",
      "MarkerTooltip",
      "Popup",
      "Arc",
      "ClusterLayer",
      "Controls",
      "ControlGroup",
      "ControlSeparator",
      "ControlButton",
      "ZoomControl",
      "CompassControl",
      "LocateControl",
      "FullscreenControl",
    ] as const) {
      expect(Map[part]).toBe(heroMap.Map[part]);
    }
    expect(useMap).toBe(heroMap.useMap);
  });

  it("takes the vocabulary names, and refuses HeroUI Pro's aria-label and onClick", () => {
    expectTypeOf<MapProps>().toHaveProperty("label");
    expectTypeOf<MapProps>().not.toHaveProperty("aria-label");
    expectTypeOf<MapMarkerProps["onPress"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<MapMarkerProps>().not.toHaveProperty("onClick");
    expectTypeOf<MapRouteProps["onPress"]>().toEqualTypeOf<(() => void) | undefined>();
    expectTypeOf<MapRouteProps>().not.toHaveProperty("onClick");
  });
});
