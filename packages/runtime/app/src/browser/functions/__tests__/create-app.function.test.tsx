// @vitest-environment jsdom
/**
 * Stackra file contract:
 * Purpose: unit tests of the browser `createApp`: both argument forms boot; with routes there is a router and `mount`
 *          renders the route tree under the container; without routes `router` is undefined and `mount` throws;
 *          `hydrate` hydrates the document with the nonce in a transition; every root reports render errors.
 * Boundary: test only; jsdom supplies the DOM; `hydrateRoot` is spied on (a real one needs a server-rendered page).
 * Runtime: node (vitest, jsdom)
 * Governing contract: ADR 0022; ADR 0269; ADR 0295 (decisions 7 and 8).
 */
import type { Wiring } from "@stackra/container";
import { useContainer } from "@stackra/container/react";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import * as client from "react-dom/client";

import { createApp } from "#browser/functions/create-app.function";
import { AppWiring } from "#core/services/app-wiring.service";

vi.mock("react-dom/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom/client")>();
  return { ...actual, hydrateRoot: vi.fn(), createRoot: vi.fn(actual.createRoot) };
});

const wiring: Wiring = { member: "@acme/console", root: "console" };

/** Shows the member the container booted, so the test sees the container reached the route. */
function Home() {
  return <p>{useContainer().get(AppWiring).wiring.member}</p>;
}

/** Collects the elements of a tree, depth first. */
function elementsOf(node: ReactNode): ReactElement[] {
  if (!isValidElement(node)) return [];
  const { children } = node.props as { readonly children?: ReactNode };
  return [node, ...[children].flat().flatMap((child) => elementsOf(child as ReactNode))];
}

describe("createApp (browser)", () => {
  afterEach(() => {
    vi.mocked(client.hydrateRoot).mockClear();
    document.body.innerHTML = "";
  });

  it("mounts the route tree under the container", async () => {
    const app = await createApp({ wiring, routes: [{ path: "/", element: <Home /> }] });
    expect(app.router).toBeDefined();
    const root = document.createElement("div");
    document.body.append(root);
    await act(async () => {
      app.mount(root);
    });
    expect(root.textContent).toBe("@acme/console");
  });

  it("has no router without routes, and mount says so", async () => {
    const app = await createApp(wiring);
    expect(app.router).toBeUndefined();
    expect(() => app.mount(document.createElement("div"))).toThrow(/routes/);
  });

  it("hydrates the document with the nonce", async () => {
    const app = await createApp(wiring);
    app.hydrate({ nonce: "bm9uY2U=" });
    await vi.waitFor(() => expect(client.hydrateRoot).toHaveBeenCalledOnce());
    const [container, tree, options] = vi.mocked(client.hydrateRoot).mock.calls[0] ?? [];
    expect(container).toBe(document);
    const nonce = elementsOf(tree).find(
      (element) => (element.props as { value?: unknown }).value === "bm9uY2U=",
    );
    expect(nonce).toBeDefined();
    expect(typeof options?.onCaughtError).toBe("function");
    expect(typeof options?.onUncaughtError).toBe("function");
  });

  it("hydrates with an empty nonce when none is given", async () => {
    const app = await createApp(wiring);
    app.hydrate();
    await vi.waitFor(() => expect(client.hydrateRoot).toHaveBeenCalledOnce());
    const [, tree] = vi.mocked(client.hydrateRoot).mock.calls[0] ?? [];
    expect(
      elementsOf(tree).some((element) => (element.props as { value?: unknown }).value === ""),
    ).toBe(true);
  });

  it("creates every root with the reporting callbacks", async () => {
    const write = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = await createApp({ wiring, routes: [{ path: "/", element: <p>home</p> }] });
    const root = document.createElement("div");
    await act(async () => {
      app.mount(root);
    });
    const options = vi.mocked(client.createRoot).mock.calls.at(-1)?.[1];
    const failure = new Error("render failed");
    options?.onUncaughtError?.(failure, { componentStack: "" });
    expect(write).toHaveBeenCalledWith(failure);
    write.mockRestore();
  });
});
