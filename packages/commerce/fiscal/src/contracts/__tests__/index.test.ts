/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: exactly the ports and enums are its values (the types
 *          erase), and every port is abstract.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/fiscal/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "FiscalChannel",
      "FiscalDevice",
      "FiscalDocumentKind",
      "FiscalDriver",
      "FiscalJournal",
      "FiscalPackSource",
      "FiscalRecordStatus",
      "FiscalSigner",
      "FiscalTransport",
      "HybridPdf",
      "PartyKind",
      "SignatureFormat",
      "TillCredentials",
      "TurnoverCipher",
    ]);
  });

  it("exports ports that extend Port", () => {
    expect(contracts.FiscalDriver.prototype).toBeInstanceOf(Port);
    expect(contracts.FiscalJournal.prototype).toBeInstanceOf(Port);
  });
});
