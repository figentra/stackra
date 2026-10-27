/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryEdiMailbox`: a name is put once, the inbox lists from a date oldest first, get and
 *          remove follow it, and control numbers count up per partner.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0266 (decision 2); ADR 0447 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { MemoryEdiMailbox } from "#core/edi/memory-edi-mailbox.driver";

describe("MemoryEdiMailbox", () => {
  it("puts once per name", async () => {
    const mailbox = new MemoryEdiMailbox();
    await mailbox.put("a", "first");
    await expect(mailbox.put("a", "second")).resolves.toEqual({ id: "a" });
    expect(mailbox.sent.get("a")).toBe("first");
  });

  it("lists, gets and removes the inbox", async () => {
    const mailbox = new MemoryEdiMailbox();
    mailbox.deliver("late", "L", new Date("2026-10-28T10:00:00Z"));
    mailbox.deliver("early", "E", new Date("2026-10-28T09:00:00Z"));
    mailbox.deliver("old", "O", new Date("2026-10-27T09:00:00Z"));
    const page = await mailbox.list(new Date("2026-10-28T00:00:00Z"));
    expect(page.files).toEqual([
      { id: "early", interchange: "E" },
      { id: "late", interchange: "L" },
    ]);
    await mailbox.remove("early");
    await expect(mailbox.get("early")).resolves.toBeUndefined();
    await expect(mailbox.get("late")).resolves.toBe("L");
  });

  it("counts control numbers per partner", async () => {
    const mailbox = new MemoryEdiMailbox();
    expect(await mailbox.nextControlNumber("ZZ:A")).toBe(1);
    expect(await mailbox.nextControlNumber("ZZ:A")).toBe(2);
    expect(await mailbox.nextControlNumber("ZZ:B")).toBe(1);
  });
});
