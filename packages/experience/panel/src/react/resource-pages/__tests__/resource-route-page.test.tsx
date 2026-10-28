/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceRoutePage`: each route page name opens its generic page (list, view, create and edit
 *          as the form page's modes) for the resource navigation hands over.
 * Boundary: unit tier, jsdom; the three pages are recording stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0164.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { cleanup, render } from "@testing-library/react";
import { vi } from "vitest";

import { resource } from "#core/functions/resource.function";
import { ResourceRoutePage } from "#react/resource-pages/resource-route-page";

const opened = vi.hoisted(() => [] as unknown[]);

vi.mock("#react/resource-pages/resource-list-page", () => ({
  ResourceListPage: (props: object) => {
    opened.push(["list", props]);
    return null;
  },
}));
vi.mock("#react/resource-pages/resource-view-page", () => ({
  ResourceViewPage: (props: object) => {
    opened.push(["view", props]);
    return null;
  },
}));
vi.mock("#react/resource-pages/resource-form-page", () => ({
  ResourceFormPage: (props: object) => {
    opened.push(["form", props]);
    return null;
  },
}));

// oxlint-disable-next-line typescript/no-extraneous-class -- reason: a stand-in query ref, read by identity only
class ListOrdersQuery {}

const Orders = resource("orders.order", { base: "/orders/orders", list: ListOrdersQuery });

afterEach(() => {
  cleanup();
  opened.length = 0;
});

describe("ResourceRoutePage", () => {
  it.each([
    ["list", ["list", { resource: Orders }]],
    ["view", ["view", { resource: Orders }]],
    ["create", ["form", { resource: Orders, mode: "create" }]],
    ["edit", ["form", { resource: Orders, mode: "edit" }]],
  ] as const)("opens the %s page", (page, expected) => {
    render(<ResourceRoutePage resource={Orders} page={page} />);
    expect(opened).toEqual([expected]);
  });
});
