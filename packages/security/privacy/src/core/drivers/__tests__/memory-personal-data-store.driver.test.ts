/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryPersonalDataStoreDriver`: finds a subject's rows with only the asked fields, deletes
 *          and anonymises by id, and reports counts.
 * Boundary: test only; stand-in models from the fixtures.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2); STA-1375.
 */
import { describe, expect, it } from "@stackra/testing";

import { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import { Customer } from "#core/__tests__/customer.fixture";
import { SUBJECT } from "#core/__tests__/subject.fixture";
import { MemoryPersonalDataStoreDriver } from "#core/drivers/memory-personal-data-store.driver";

/** A store with two of the subject's customers and one of someone else. */
function seeded(): MemoryPersonalDataStoreDriver {
  const store = new MemoryPersonalDataStoreDriver();
  store.put(Customer, [
    { id: "cus_1", userId: SUBJECT, name: "Lina", phone: "+966500000000", tier: "gold" },
    { id: "cus_2", userId: SUBJECT, name: "Lina K", phone: null, tier: "silver" },
    { id: "cus_3", userId: "usr_other", name: "Omar", phone: "+20100000000", tier: "gold" },
  ]);
  return store;
}

describe("MemoryPersonalDataStoreDriver", () => {
  it("is a PersonalDataStore driver", () => {
    expect(new MemoryPersonalDataStoreDriver()).toBeInstanceOf(PersonalDataStore);
  });

  it("finds the subject's rows with only the declared fields", async () => {
    await expect(seeded().find(Customer, "userId", SUBJECT, ["name", "phone"])).resolves.toEqual([
      { id: "cus_1", fields: { name: "Lina", phone: "+966500000000" } },
      { id: "cus_2", fields: { name: "Lina K", phone: null } },
    ]);
  });

  it("deletes and anonymises by id only", async () => {
    const store = seeded();
    await expect(store.anonymise(Customer, ["cus_1"], ["phone"])).resolves.toBe(1);
    await expect(store.remove(Customer, ["cus_2", "cus_9"])).resolves.toBe(1);
    expect(store.all(Customer).map(({ id, phone }) => ({ id, phone }))).toEqual([
      { id: "cus_1", phone: null },
      { id: "cus_3", phone: "+20100000000" },
    ]);
  });
});
