/**
 * Stackra file contract:
 * Purpose: unit tests of `registerDocumentResolver` and `loadRoute`: a document route with no data of its own loads the
 *          coded class without a resolver and the resolver's answer with one; a route's own data wins; the disposer
 *          restores the coded class.
 * Boundary: test only; the document class and the resolver are local stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0110; ADR 0114.
 */
import { afterEach, describe, expect, it } from "vitest";

import { Route } from "#core/bases/route.base";
import { ROUTE_DOCUMENTS } from "#core/constants/route-documents.constant";
import { createRouteContext } from "#core/functions/create-route-context.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { loadRoute } from "#core/functions/load-route.function";
import { registerDocumentResolver } from "#core/functions/register-document-resolver.function";

class WelcomeDocument {}

class WelcomeRoute extends Route({
  path: "/welcome",
  document: WelcomeDocument,
}) {}

class AnnouncementsRoute extends Route({
  path: "/announcements",
  document: WelcomeDocument,
}) {
  override loader() {
    return { custom: true };
  }
}

/** The loader's answer for `type`. */
function load(type: typeof WelcomeRoute | typeof AnnouncementsRoute) {
  const ctx = createRouteContext({ type, request: new Request("http://localhost/welcome") });
  return loadRoute(type, instanceOf(type), ctx);
}

afterEach(() => {
  ROUTE_DOCUMENTS.resolve = null;
});

describe("registerDocumentResolver", () => {
  it("loads the coded class without a resolver", async () => {
    expect(await load(WelcomeRoute)).toEqual({ document: WelcomeDocument });
  });

  it("loads the resolver's answer, and the disposer restores the class", async () => {
    const dispose = registerDocumentResolver(async (document) => ({ published: document.name }));
    expect(await load(WelcomeRoute)).toEqual({ document: { published: "WelcomeDocument" } });
    dispose();
    expect(await load(WelcomeRoute)).toEqual({ document: WelcomeDocument });
  });

  it("leaves a route's own data alone", async () => {
    registerDocumentResolver(() => "resolved");
    expect(await load(AnnouncementsRoute)).toEqual({ custom: true });
  });
});
