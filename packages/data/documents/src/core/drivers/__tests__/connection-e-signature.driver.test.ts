/**
 * Stackra file contract:
 * Purpose: unit tests of `ConnectionESignatureDriver`: `send` resolves the `e-signature` provider and prefixes the
 *          envelope id with provider and Connection; follow-ups reload that Connection and pass the provider's own id;
 *          an id it did not answer is not found.
 * Boundary: test only; the resolver is an in-memory stand-in and the Connection a `DocumensoConnection` whose calls
 *           are replaced, so no store and no provider is reached.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0356 (decision 2); ADR 0365 (decision 5).
 */
import type { IntegrationApi, ProviderResolver } from "@stackra/integrations";
import { makeConnection } from "@stackra/integrations/testing";
import { describe, expect, it } from "@stackra/testing";

import { SignatureStatus } from "#contracts/enums/signature-status.enum";
import { ConnectionESignatureDriver } from "#core/drivers/connection-e-signature.driver";
import { DocumensoConnection } from "#core/drivers/documenso.connection";
import { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";

const DRIVERS = { documenso: DocumensoConnection };

/** An open envelope with the provider's id. */
const envelope = (id: string) => ({ id, reference: "frm_1", status: SignatureStatus.Sent });

/** A Documenso connection whose calls answer from memory, and what it was asked. */
function setup() {
  const asked: string[] = [];
  const connection = makeConnection(DocumensoConnection, {
    id: "conn_00000000000000000000000001",
    api: {} as IntegrationApi,
    fields: { host: "sign.acme.example", apiKey: "k", timeoutMs: 1 },
  });
  connection.send = async () => envelope("42");
  connection.status = async (id) => {
    asked.push(`status ${id}`);
    return envelope(id);
  };
  connection.download = async (id) => {
    asked.push(`download ${id}`);
    return new Uint8Array([1]);
  };
  connection.cancel = async (id) => {
    asked.push(`cancel ${id}`);
    return { ...envelope(id), status: SignatureStatus.Cancelled };
  };
  const resolver = {
    async resolve(capability: string, drivers: object) {
      asked.push(`resolve ${capability} ${drivers === DRIVERS}`);
      return connection;
    },
    async byConnection(drivers: object, provider: string, connectionId: string) {
      asked.push(`byConnection ${provider} ${connectionId}`);
      return connection;
    },
  } as unknown as ProviderResolver;
  return { driver: new ConnectionESignatureDriver(resolver, DRIVERS), asked };
}

describe("ConnectionESignatureDriver", () => {
  it("sends through the resolved provider and prefixes the id", async () => {
    const { driver, asked } = setup();
    const sent = await driver.send({
      reference: "frm_1",
      title: "T",
      document: new Uint8Array(),
      contentHash: "sha256:00",
      signers: [],
      locale: "en",
    });
    expect(sent.id).toBe("documenso:conn_00000000000000000000000001:42");
    expect(asked).toEqual(["resolve e-signature true"]);
  });

  it("reaches the same Connection for every follow-up", async () => {
    const { driver, asked } = setup();
    const id = "documenso:conn_00000000000000000000000001:42";
    expect((await driver.status(id)).id).toBe(id);
    await expect(driver.download(id)).resolves.toEqual(new Uint8Array([1]));
    expect((await driver.cancel(id)).status).toBe(SignatureStatus.Cancelled);
    expect(asked.filter((line) => !line.startsWith("byConnection"))).toEqual([
      "status 42",
      "download 42",
      "cancel 42",
    ]);
    expect(asked).toContain("byConnection documenso conn_00000000000000000000000001");
  });

  it("refuses an id it did not answer", async () => {
    const { driver } = setup();
    await expect(driver.status("env_1")).rejects.toThrow(SignatureEnvelopeNotFoundError);
    await expect(driver.status("docusign:conn_1:42")).rejects.toThrow(
      SignatureEnvelopeNotFoundError,
    );
  });
});
