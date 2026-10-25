/**
 * Stackra file contract:
 * Purpose: unit and type tests of the `PayloadSeal` port: an abstract class that extends `Port`, keyed
 *          `storage.PayloadSeal`, that makes a driver implement `isEncrypting`, `seal` and `open`, and whose payload
 *          is unreadable once the key in `secrets` is wiped (ADR 0338's planned storage test, through the memory
 *          driver's binding).
 * Boundary: test only; the bound driver is the package's memory seal over the memory storage driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0338 (decision 2); ADR
 *                     0294 (decision 16).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { PayloadSeal } from "#contracts/ports/payload-seal.port";
import { MemoryPayloadSealDriver } from "#core/drivers/memory-payload-seal.driver";
import { MemoryStorageDriver } from "#core/drivers/memory-storage.driver";

describe("PayloadSeal", () => {
  it("is an abstract port keyed storage.PayloadSeal", () => {
    const seal = new MemoryPayloadSealDriver(new MemoryStorageDriver());
    expect(seal).toBeInstanceOf(Port);
    expect(seal).toBeInstanceOf(PayloadSeal);
    expectTypeOf<PayloadSeal["~key"]>().toEqualTypeOf<"storage.PayloadSeal">();
    expectTypeOf<PayloadSeal["open"]>().returns.toEqualTypeOf<Promise<string | undefined>>();
  });

  it("makes a driver implement isEncrypting, seal and open", () => {
    // @ts-expect-error -- isEncrypting, seal and open are abstract and not implemented
    class EmptyDriver extends Driver(PayloadSeal) {}
    expect(EmptyDriver).toBeTypeOf("function");
  });

  it("opens a payload only while the key in secrets is the one it was sealed with", async () => {
    const storage = new MemoryStorageDriver();
    const seal: PayloadSeal = new MemoryPayloadSealDriver(storage);
    const sealed = await seal.seal('{"items":[]}');
    expect(await seal.open(sealed)).toBe('{"items":[]}');
    storage.secrets.clear();
    expect(await seal.open(sealed)).toBeUndefined();
  });
});
