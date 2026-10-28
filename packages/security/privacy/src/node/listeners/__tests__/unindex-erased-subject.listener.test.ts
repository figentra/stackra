/**
 * Stackra file contract:
 * Purpose: unit tests of `UnindexErasedSubjectListener`: after `SubjectErased`, the subject's remaining rows of each
 *          declared model go to `SearchForgetService`, another subject's rows never do.
 * Boundary: test only; the memory personal-data store and a stand-in forget service recording calls.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0189 (decision 2); ADR 0221 (decision 7).
 */
import { Listener } from "@stackra/events";
import type { ListenerContext } from "@stackra/events";
import type { SearchForgetService } from "@stackra/search/node";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Address } from "#core/__tests__/address.fixture";
import { AddressPersonalData } from "#core/__tests__/address-personal-data.fixture";
import { Customer } from "#core/__tests__/customer.fixture";
import { CustomerPersonalData } from "#core/__tests__/customer-personal-data.fixture";
import { SUBJECT } from "#core/__tests__/subject.fixture";
import { MemoryPersonalDataStoreDriver } from "#core/drivers/memory-personal-data-store.driver";
import { SubjectErased } from "#core/events/subject-erased.event";
import { registerPersonalData } from "#core/functions/register-personal-data.function";
import { UnindexErasedSubjectListener } from "#node/listeners/unindex-erased-subject.listener";
import { clearPersonalData } from "#testing/clear-personal-data.function";

/** The listener over the memory store, with a recording forget service. */
function setup() {
  const store = new MemoryPersonalDataStoreDriver();
  store.put(Customer, [{ id: "cus_1", userId: SUBJECT, name: null, phone: null }]);
  store.put(Address, [
    { id: "adr_2", userId: SUBJECT, line: "2 Olaya St" },
    { id: "adr_3", userId: "usr_other", line: "3 Tahlia St" },
  ]);
  const forget = { forget: vi.fn(async () => undefined) };
  const listener = new UnindexErasedSubjectListener(
    store,
    forget as unknown as SearchForgetService,
  );
  return { forget, listener };
}

afterEach(() => {
  clearPersonalData();
});

describe(UnindexErasedSubjectListener, () => {
  it("is a listener", () => {
    expect(setup().listener).toBeInstanceOf(Listener);
  });

  it("forgets the subject's remaining rows of every declared model", async () => {
    registerPersonalData("crm", [CustomerPersonalData, AddressPersonalData]);
    const { forget, listener } = setup();
    const event = SubjectErased.create({
      erasureId: "era_1",
      subject: SUBJECT,
      erased: [],
      kept: [{ kind: "crm.address", reason: "hold", count: 1 }],
      shredded: true,
      at: "2026-10-28T12:00:00.000Z",
    });

    await listener.handle(event, {} as ListenerContext);

    expect(forget.forget.mock.calls).toEqual([
      [Customer, ["cus_1"]],
      [Address, ["adr_2"]],
    ]);
  });
});
