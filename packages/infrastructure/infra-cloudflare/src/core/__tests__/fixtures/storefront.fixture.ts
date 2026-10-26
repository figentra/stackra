/**
 * Stackra file contract:
 * Purpose: test fixture: `STOREFRONT_SETTINGS`, a storefront's campaign settings as the storefront exports them: a
 *          shopper cookie, a spring drop with a waiting room on and two hot-item limits, and a quiet campaign with its
 *          room off and no limits.
 * Boundary: test only; every value is test data.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0402.
 */

/** The storefront settings. */
export const STOREFRONT_SETTINGS = {
  shopper: { by: "cookie", name: "shopper_id" },
  campaigns: {
    "spring-drop": {
      host: "shop.figentra.com",
      path: "/drops/spring",
      waitingRoom: {
        enabled: true,
        totalActiveUsers: 500,
        newUsersPerMinute: 200,
        sessionMinutes: 10,
        startsAt: "2026-11-01T09:00:00+03:00",
        endsAt: "2026-11-01T21:00:00+03:00",
        prequeueMinutes: 30,
      },
      limits: [
        { path: "/products/sneaker-1", requests: 5, periodSeconds: 60 },
        { path: "/cart/add/sneaker-1", requests: 2, periodSeconds: 60 },
      ],
    },
    quiet: {
      host: "shop.figentra.com",
      waitingRoom: {
        enabled: false,
        totalActiveUsers: 200,
        newUsersPerMinute: 200,
        startsAt: "2026-12-01T00:00:00Z",
        endsAt: "2026-12-02T00:00:00Z",
      },
    },
  },
};
