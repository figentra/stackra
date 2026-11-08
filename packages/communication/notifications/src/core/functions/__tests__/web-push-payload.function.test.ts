/**
 * Stackra file contract:
 * Purpose: proves the Web Push payload: title, body and data always; the action category and buttons only when given.
 * Boundary: unit tier; the pure function, no encryption.
 * Runtime: node
 * Governing contract: ADR 0223 (decision 1); ADR 0533 (decision 4); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";
import { webPushPayload } from "#core/functions/web-push-payload.function";

/** The device every case pushes to. */
const target = {
  kind: "web",
  endpoint: "https://push.example/s/1",
  p256dh: "k",
  auth: "a",
} as const;

/** Guards what the service worker receives. */
describe(webPushPayload, () => {
  /** A plain push carries no category and no actions. */
  it("carries the title, body and data", () => {
    expect(JSON.parse(webPushPayload({ target, title: "T", body: "B", ttlSeconds: 60 }))).toEqual({
      title: "T",
      body: "B",
      data: {},
    });
  });

  /** Buttons ride with their category; an empty list is left out. */
  it("adds the category and buttons when given", () => {
    const actions = [
      { label: "Approve", url: "https://approvals.example/a", style: "primary" },
    ] as const;

    expect(
      JSON.parse(
        webPushPayload({
          target,
          title: "T",
          body: "B",
          ttlSeconds: 60,
          category: "approval_request",
          actions,
        }),
      ),
    ).toEqual({ title: "T", body: "B", data: {}, category: "approval_request", actions });
    expect(
      JSON.parse(webPushPayload({ target, title: "T", body: "B", ttlSeconds: 60, actions: [] })),
    ).toEqual({ title: "T", body: "B", data: {} });
  });
});
