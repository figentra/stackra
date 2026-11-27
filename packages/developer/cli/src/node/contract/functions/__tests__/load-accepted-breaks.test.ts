/**
 * Stackra file contract:
 * Purpose: unit tests of `loadAcceptedBreaks`: a missing or empty file accepts nothing, a well-formed entry is kept
 *          and marked expired after its `expires`, and every malformed entry is a problem line naming its index (missing
 *          fields, an operation that is not `<METHOD> <path>`, no issue key, a future `added`, a window over 30 days).
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0182 (decision 4); STA-2837.
 */
import { describe, expect, it } from "@stackra/testing";

import { loadAcceptedBreaks } from "#node/contract/functions/load-accepted-breaks.function";

const entry = {
  member: "services/billing",
  operation: "POST /app/invoices/{invoiceId}/void",
  id: "api-path-removed-without-deprecation",
  issue: "STA-2837",
  reason: "the console is the only caller and moves in the same change",
  added: "2026-11-20",
  expires: "2026-12-01",
};

const yaml = (items: readonly Record<string, unknown>[]): string =>
  `accepted:\n${items
    .map(
      (item) =>
        `  - ${Object.entries(item)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join("\n    ")}`,
    )
    .join("\n")}\n`;

describe("loadAcceptedBreaks", () => {
  it("accepts nothing from a missing or empty file", () => {
    expect(loadAcceptedBreaks("", "2026-11-26")).toEqual({ entries: [], problems: [] });
    expect(loadAcceptedBreaks("accepted: []\n", "2026-11-26")).toEqual({
      entries: [],
      problems: [],
    });
  });

  it("keeps a well-formed entry and marks it expired after its last day", () => {
    expect(loadAcceptedBreaks(yaml([entry]), "2026-12-01")).toEqual({
      entries: [{ ...entry, expired: false }],
      problems: [],
    });
    expect(loadAcceptedBreaks(yaml([entry]), "2026-12-02").entries[0]?.expired).toBe(true);
  });

  it("names each malformed entry by its index", () => {
    const { entries, problems } = loadAcceptedBreaks(
      yaml([
        { ...entry, reason: "" },
        { ...entry, operation: "remove the void endpoint" },
        { ...entry, issue: "soon" },
        { ...entry, added: "26/11/2026" },
        { ...entry, added: "2026-11-27" },
        { ...entry, expires: "2027-01-31" },
        { ...entry, expires: "2026-11-19" },
        entry,
      ]),
      "2026-11-26",
    );
    expect(entries).toHaveLength(1);
    expect(problems).toEqual([
      "accepted[0]: member, id and reason are required",
      "accepted[1]: operation must be `<METHOD> <path>`, such as `POST /invoices`",
      "accepted[2]: issue must be an issue key (STA-n)",
      "accepted[3]: added and expires must be YYYY-MM-DD",
      "accepted[4]: added 2026-11-27 is in the future",
      "accepted[5]: expires must be 0 to 30 days after added (an accepted break is for one change)",
      "accepted[6]: expires must be 0 to 30 days after added (an accepted break is for one change)",
    ]);
  });

  it("refuses a list that is not one and a run date that is not a date", () => {
    expect(() => loadAcceptedBreaks("accepted: yes\n", "2026-11-26")).toThrow(
      "`accepted` must be a list",
    );
    expect(() => loadAcceptedBreaks("", "today")).toThrow("today must be YYYY-MM-DD");
  });
});
