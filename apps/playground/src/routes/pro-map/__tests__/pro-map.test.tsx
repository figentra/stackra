/**
 * Stackra file contract:
 * Purpose: proves the Map page sits at /pro-map in the Pro category, titles the page and the document, hands the map its
 *          name and a tile-free style, and lets the buttons choose the stop that is reported.
 * Boundary: HeroUI Pro's map is replaced by a stand-in that records the props it receives and draws its children,
 *          because MapLibre needs WebGL, which jsdom lacks. The real map is drawn in the browser.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 12); ADR 0022 (test placement).
 */
// @covers sta-416:FR-012
import { fireEvent, render, screen } from "@testing-library/react";

import { stubBrowserApis } from "#src/__tests__/stub-browser-apis";
import { ProMap } from "#src/routes/pro-map/pro-map";
import { ProMapRoute } from "#src/routes/pro-map/pro-map.route";

const { seen } = vi.hoisted(() => ({ seen: [] as Record<string, unknown>[] }));

vi.mock("@heroui-pro/react/map", () => {
  const names = [
    "Marker",
    "MarkerContent",
    "MarkerDot",
    "MarkerLabel",
    "MarkerPopup",
    "MarkerTooltip",
    "Popup",
    "Route",
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
    Map: {
      Root: (props: Record<string, unknown>) => {
        seen.push(props);
        return <div data-testid="map" />;
      },
      ...Object.fromEntries(names.map((name) => [name, () => null])),
    },
    useMap: () => ({ isLoaded: false, map: null }),
  };
});

describe("ProMap", () => {
  beforeEach(() => {
    seen.length = 0;
    stubBrowserApis();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("sits at /pro-map in the Pro category, and titles the page and the document", () => {
    render(<ProMap />);
    expect(ProMapRoute.path).toBe("/pro-map");
    expect(ProMapRoute.category).toBe("Data display");
    expect(screen.getByRole("heading", { level: 1, name: ProMapRoute.title })).toBeTruthy();
    expect(document.title).toBe("Map · Stackra Playground");
  });

  it("names the map and gives it a style with no sources, so no tiles are fetched", () => {
    render(<ProMap />);
    const props = seen.at(-1) as {
      "aria-label": string;
      styles: Record<string, { sources: object }>;
    };
    expect(props["aria-label"]).toBe("Dispatch route from the Ferry Building to Chase Center");
    expect(Object.keys(props.styles.light?.sources ?? { x: 1 })).toEqual([]);
    expect(Object.keys(props.styles.dark?.sources ?? { x: 1 })).toEqual([]);
  });

  it("tells the map where MapLibre's worker is, so the route's data source loads under Vite", () => {
    render(<ProMap />);
    const props = seen.at(-1) as { workerUrl?: unknown };
    expect(String(props.workerUrl)).toMatch(/maplibre-gl-worker\.mjs/);
  });

  it("chooses a stop from the buttons, and reports it", () => {
    render(<ProMap />);
    expect(screen.getByRole("status").textContent).toBe("Chase Center: Dropoff, arrival 9:27 AM");
    fireEvent.click(screen.getByRole("button", { name: "Show Market Street" }));
    expect(screen.getByRole("status").textContent).toBe(
      "Market Street: Next stop, arrival 9:19 AM",
    );
  });
});
