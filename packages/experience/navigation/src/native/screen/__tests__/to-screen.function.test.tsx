// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of `toScreen`: the screen validates its params, runs the loader and renders the page with
 *          `{ data, params, search }`; a document route renders its document; a redirect replaces the screen; a failure
 *          shows the error state whose retry runs the loader again; the page reaches the reload.
 * Boundary: test only; React Native, React Navigation, the native UI kit and the locale hook are replaced by recording
 *           stand-ins (none runs in vitest); the container is real.
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0165; ADR 0294 (decision 16); ADR 0110.
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { z } from "zod";

import { Route } from "#core/bases/route.base";
import type { RouteContext } from "#core/types/route-context.type";
import type { RouteProps } from "#core/types/route-props.type";
import { useRouteReload } from "#native/route-reload/use-route-reload";
import { toScreen } from "#native/screen/to-screen.function";

const navigation = vi.hoisted(() => ({ dispatch: vi.fn() }));

vi.mock("react-native", () => ({ Linking: { openURL: vi.fn(async () => undefined) } }));
vi.mock("@react-navigation/native", () => ({
  useNavigation: () => navigation,
  StackActions: {
    replace: (name: string, params?: object) => ({ type: "REPLACE", payload: { name, params } }),
  },
}));
vi.mock("@stackra/i18n/react", () => ({ useLocale: () => ({ locale: "en" }) }));
vi.mock("@stackra/ui/native", () => ({
  Spinner: () => <p>loading</p>,
  ErrorState: ({
    title,
    retry,
  }: {
    title: ReactNode;
    retry: { label: string; onPress: () => void };
  }) => (
    <section>
      <p>{title}</p>
      <button type="button" onClick={retry.onPress}>
        {retry.label}
      </button>
    </section>
  ),
}));

class OrderDetailParams extends Schema {
  orderId!: string;
}

registerSchemas([[OrderDetailParams, z.object({ orderId: z.string().startsWith("ord_") })]]);

let failures = 0;

class OrderDetailRoute extends Route({ path: "/orders/:orderId", params: OrderDetailParams }) {
  override loader(ctx: RouteContext<this>) {
    if (ctx.params.orderId === "ord_moved")
      return ctx.redirect({ name: "orders" }, { status: "open" });
    if (ctx.params.orderId === "ord_flaky" && failures++ === 0) throw new Error("offline");
    return { order: { id: ctx.params.orderId } };
  }
}

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a document class stand-in
class AnnouncementsDocument {}
class AnnouncementsRoute extends Route({
  path: "/announcements",
  document: AnnouncementsDocument,
}) {}

function OrderDetail({ data, params }: RouteProps<typeof OrderDetailRoute>) {
  const reload = useRouteReload();
  return (
    <button type="button" onClick={() => void reload.run()}>
      {`${data.order.id} ${params.orderId}`}
    </button>
  );
}

function Announcements({ data }: RouteProps<typeof AnnouncementsRoute>) {
  return <p>{(data as { document: { name: string } }).document.name}</p>;
}

/** Renders the screen of `entry` with `params`. */
async function renderScreen(Screen: ReturnType<typeof toScreen>, params: object) {
  const container = await Container.create([]);
  render(
    <ContainerProvider container={container}>
      <Screen route={{ params }} />
    </ContainerProvider>,
  );
}

afterEach(() => {
  cleanup();
  failures = 0;
  navigation.dispatch.mockClear();
});

describe("toScreen", () => {
  it("validates the params, runs the loader and renders the page", async () => {
    await renderScreen(toScreen({ route: OrderDetailRoute, page: OrderDetail }), {
      orderId: "ord_1",
    });
    expect(screen.getByText("loading")).toBeTruthy();
    const page = await screen.findByText("ord_1 ord_1");
    await act(async () => page.click());
    expect(screen.getByText("ord_1 ord_1")).toBeTruthy();
  });

  it("renders a document route's document", async () => {
    await renderScreen(toScreen({ route: AnnouncementsRoute, page: Announcements }), {});
    expect(await screen.findByText("AnnouncementsDocument")).toBeTruthy();
  });

  it("replaces the screen on a redirect", async () => {
    await renderScreen(toScreen({ route: OrderDetailRoute, page: OrderDetail }), {
      orderId: "ord_moved",
    });
    await vi.waitFor(() =>
      expect(navigation.dispatch).toHaveBeenCalledWith({
        type: "REPLACE",
        payload: { name: "orders", params: { status: "open" } },
      }),
    );
  });

  it("shows the error state for refused params and a failure, and retries", async () => {
    await renderScreen(toScreen({ route: OrderDetailRoute, page: OrderDetail }), { orderId: "1" });
    expect(await screen.findByText("This screen could not load")).toBeTruthy();
    cleanup();
    await renderScreen(toScreen({ route: OrderDetailRoute, page: OrderDetail }), {
      orderId: "ord_flaky",
    });
    const retry = await screen.findByRole("button", { name: "Try again" });
    await act(async () => retry.click());
    expect(await screen.findByText("ord_flaky ord_flaky")).toBeTruthy();
  });
});
