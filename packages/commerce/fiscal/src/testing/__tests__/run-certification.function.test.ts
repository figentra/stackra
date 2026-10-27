/**
 * Stackra file contract:
 * Purpose: unit tests of `runCertification`: a missed expectation is reported, exact port-fed values are checked only
 *          on a fully recorded run, a port-free hash is checked always, and a sandbox run takes its endpoints, seller
 *          and buyer from config and submits through the caller's transport.
 * Boundary: test only; the transports are fakes standing in for a sandbox.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import { certificationCases } from "#testing/certification-cases.fixture";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { runCertification } from "#testing/run-certification.function";

const byId = (id: string) => {
  const found = certificationCases().find((certification) => certification.id === id);
  if (!found) throw new Error(`no case ${id}`);
  return found;
};

describe("runCertification", () => {
  it("reports every expectation the sealed output misses", async () => {
    const certification = byId("verifactu.huella-first");
    const result = await runCertification({
      ...certification,
      expect: { hash: "WRONG", portFree: true, payload: ["<absent/>"], qrContains: ["absent"] },
    });
    expect(result.mismatches).toEqual([
      `hash: expected WRONG, got ${result.sealed.hash}`,
      "payload: missing <absent/>",
      "qr: missing absent",
    ]);
  });

  it("checks a port-fed QR only on a recorded run and a port-free hash always", async () => {
    const tse = byId("tse.dsfinv-k-qr");
    const verifactu = byId("verifactu.huella-first");
    const transport = FiscalTransportFake.answering(verifactu.recorded.answers?.[0] ?? never());
    const withPorts = await runCertification(
      { ...tse, expect: { qr: "other" } },
      { ports: { transport } },
    );
    const wrongHash = await runCertification(
      { ...verifactu, expect: { hash: "WRONG", portFree: true } },
      {
        ports: {
          transport: FiscalTransportFake.answering(verifactu.recorded.answers?.[0] ?? never()),
        },
      },
    );
    expect(withPorts.mismatches).toEqual([]);
    expect(wrongHash.mismatches).toHaveLength(1);
  });

  it("submits to the sandbox endpoint and seller from config through the caller's transport", async () => {
    const certification = byId("verifactu.huella-first");
    const transport = FiscalTransportFake.answering(certification.recorded.answers?.[0] ?? never());
    const buyer = {
      ...certification.document.seller,
      name: "Registered Buyer",
      taxId: "B00000000",
    };
    const result = await runCertification(certification, {
      ports: { transport },
      sandbox: {
        options: { submitUrl: "https://sandbox.test/verifactu" },
        seller: { name: "Registered Issuer" },
        buyer,
      },
    });
    const [request] = transport.calls("send") as TransportRequest[];
    expect(request?.url).toBe("https://sandbox.test/verifactu");
    expect(request?.body).toContain("<sum1:NombreRazon>Registered Issuer</sum1:NombreRazon>");
    expect(request?.body).toContain("<sum1:NIF>B00000000</sum1:NIF>");
    expect(result.outcome?.status).toBe(FiscalRecordStatus.Accepted);
  });

  it("does not submit an offline case without recorded answers", async () => {
    const result = await runCertification(byId("zatca.standard-supply-date"));
    expect(result.outcome).toBeNull();
  });
});

function never(): never {
  throw new Error("case has no recorded answer");
}
