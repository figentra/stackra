/**
 * Stackra file contract:
 * Purpose: unit tests of `handleShareTarget`: a shared form is kept in the share inbox and answered with a 303 to the
 *          share page carrying its id; a redirect outside the app is refused.
 * Boundary: test only; IndexedDB is `fake-indexeddb` and the worker scope's `location` is stubbed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0255 (share target).
 */
import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { takeSharedPayload } from "#core/functions/take-shared-payload.function";
import { handleShareTarget } from "#sw/functions/handle-share-target.function";

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The share sheet's POST. */
function shareRequest(): Request {
  const form = new FormData();
  form.set("title", "Dates");
  form.set("text", "");
  form.set("url", "https://acme.test/p/1");
  form.append("images", new File(["png"], "photo.png", { type: "image/png" }));
  return new Request("https://console.acme.test/ar/share", { method: "POST", body: form });
}

describe("handleShareTarget", () => {
  it("keeps the share and redirects to the page with its id", async () => {
    vi.stubGlobal("location", { origin: "https://console.acme.test" });
    const response = await handleShareTarget(
      { request: shareRequest() },
      { redirectTo: "/ar/share" },
    );
    expect(response.status).toBe(303);
    const target = new URL(response.headers.get("location") ?? "");
    expect(target.pathname).toBe("/ar/share");
    const shared = await takeSharedPayload(target.searchParams.get("shared") ?? "");
    expect(shared).toMatchObject({ title: "Dates", text: null, url: "https://acme.test/p/1" });
    expect(shared?.files.map((file) => file.name)).toEqual(["photo.png"]);
  });

  it("refuses a redirect outside the app", async () => {
    await expect(
      handleShareTarget({ request: shareRequest() }, { redirectTo: "//evil.test" }),
    ).rejects.toThrow(TypeError);
  });
});
