/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./native` entry: the template's `ContextMenu`, `toScreen`, `useLayoutLoader`,
 *          `useNavigate` and `useRouteReload`, the `ReactNavigationProvider`, the `RouteLeaveConfirmation` and the
 *          route overlay (`RouteOverlay`, `routeOverlayScreenOptions`, `useRouteOverlay`), and nothing else
 *          (`RouteProps` is `.`'s only, registry A3).
 * Boundary: test only; React Native and React Navigation are stubbed, since the barrel imports modules that use them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("react-native", () => ({ Linking: { openURL: vi.fn() }, View: vi.fn() }));
vi.mock("react-native-safe-area-context", () => ({ useSafeAreaInsets: vi.fn() }));
vi.mock("@react-navigation/native", () => ({ useNavigation: vi.fn(), StackActions: {} }));
vi.mock("@stackra/ui/native", () => ({ Menu: vi.fn(), Spinner: vi.fn(), ErrorState: vi.fn() }));

describe("@stackra/navigation/native", () => {
  // The first import loads the whole native entry; under coverage instrumentation that alone passes the 5 s default.
  it("exports exactly its values", { timeout: 30_000 }, async () => {
    const native = await import("#native/index");
    expect(Object.keys(native).sort()).toEqual([
      "ContextMenu",
      "ReactNavigationProvider",
      "RouteLeaveConfirmation",
      "RouteOverlay",
      "routeOverlayScreenOptions",
      "toScreen",
      "useLayoutLoader",
      "useNavigate",
      "useRouteOverlay",
      "useRouteReload",
    ]);
  });
});
