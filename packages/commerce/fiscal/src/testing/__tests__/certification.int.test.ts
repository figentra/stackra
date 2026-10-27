/**
 * Stackra file contract:
 * Purpose: integration tier of the fiscal certification harness: runs each configured case against its authority's
 *          sandbox and expects the specification checks to hold and the authority to accept (or, for ETA, take) the
 *          record.
 * Boundary: integration tier (`.int`), skipped unless `STACKRA_FISCAL_SANDBOX` holds the sandbox config: JSON keyed
 *           by case id, each `{ options, seller?, buyer?, headers? }` (endpoints issued with the access, the
 *           registered issuer, and the credential headers, e.g. an ETA POS bearer token). The value is a secret: it
 *           comes from Infisical on ci-box, never from a file. The transport here is plain fetch and the other ports
 *           are the recorded fakes, so it serves the cases whose only secret is a header (ETA e-receipt); a case
 *           that needs mutual TLS (Verifactu), a real signing key (ZATCA XAdES with its CSID, RKSV) or a device (TSE)
 *           is run by the host's suite with its own bindings through `runCertification`. Until a run passes, every
 *           driver is certification pending.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (test tiers); ADR 0173 (secrets); ADR 0364; owner decision D3 (2026-10-27).
 */
import { Driver } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TransportRequest } from "#contracts/types/transport-request.type";
import type { TransportResponse } from "#contracts/types/transport-response.type";
import type { CertificationSandbox } from "#testing/certification-sandbox.type";
import { certificationCases } from "#testing/certification-cases.fixture";
import { runCertification } from "#testing/run-certification.function";

type SandboxEntry = CertificationSandbox & { readonly headers?: Readonly<Record<string, string>> };

const config: Readonly<Record<string, SandboxEntry>> = JSON.parse(
  process.env.STACKRA_FISCAL_SANDBOX ?? "{}",
);

/** fetch with the case's credential headers; a network failure throws, every status is returned. */
class FetchTransport extends Driver(FiscalTransport) {
  /** The sandbox credential, attached to authenticated calls only. */
  private readonly credentialHeaders: Readonly<Record<string, string>>;

  constructor(credentialHeaders: Readonly<Record<string, string>>) {
    super();
    this.credentialHeaders = credentialHeaders;
  }

  async send(request: TransportRequest): Promise<TransportResponse> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: { ...request.headers, ...(request.credential ? this.credentialHeaders : {}) },
      body: request.body,
    });
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: await response.text(),
    };
  }
}

const configured = certificationCases().filter((certification) => config[certification.id]);

describe.skipIf(configured.length === 0)("fiscal certification against authority sandboxes", () => {
  it.each(configured.map((certification) => [certification.id, certification] as const))(
    "%s is accepted by the sandbox",
    async (id, certification) => {
      const sandbox = config[id] ?? {};
      const result = await runCertification(certification, {
        ports: { transport: new FetchTransport(sandbox.headers ?? {}) },
        sandbox,
      });
      expect(result.mismatches).toEqual([]);
      // ETA validates after accepting, so `submitted` passes here; polling is the driver's `poll`.
      expect([FiscalRecordStatus.Accepted, FiscalRecordStatus.Submitted]).toContain(
        result.outcome?.status,
      );
    },
    60_000,
  );
});
