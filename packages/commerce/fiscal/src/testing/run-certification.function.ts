/**
 * Stackra file contract:
 * Purpose: `runCertification`, the fiscal certification harness: seals one `CertificationCase` with its driver, checks
 *          the sealed output against what the specification fixes, and submits the record when a sandbox is
 *          configured (or when the case recorded the authority's answers).
 * Boundary: a test helper in the `./testing` entry. Ports the caller leaves out are recorded fakes, so the offline
 *           run needs nothing. A sandbox run takes the endpoints and the registered seller from config
 *           (`CertificationSandbox`) and the caller's real ports (a transport that attaches the sandbox credential, a
 *           signer over the sandbox key); this package never reads config, the network or a secret itself.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4); ADR 0269; owner decision D3 (2026-10-27): certification pending
 *                     until a sandbox run passes.
 */
import { FiscalChannel } from "#contracts/enums/fiscal-channel.enum";
import { FiscalRecordStatus } from "#contracts/enums/fiscal-record-status.enum";
import type { FiscalRecord } from "#contracts/types/fiscal-record.type";
import type { SealedPayload } from "#contracts/types/sealed-payload.type";
import type { CertificationCase } from "#testing/certification-case.type";
import type { CertificationPorts } from "#testing/certification-ports.type";
import type { CertificationResult } from "#testing/certification-result.type";
import type { CertificationSandbox } from "#testing/certification-sandbox.type";
import { FiscalDeviceFake } from "#testing/fiscal-device.fake";
import { FiscalSignerFake } from "#testing/fiscal-signer.fake";
import { FiscalTransportFake } from "#testing/fiscal-transport.fake";
import { TillCredentialsFake } from "#testing/till-credentials.fake";
import { TurnoverCipherFake } from "#testing/turnover-cipher.fake";

/** Every expectation the sealed output misses. */
function mismatches(
  certification: CertificationCase,
  sealed: SealedPayload,
  recorded: boolean,
): string[] {
  const { expect } = certification;
  const missed: string[] = [];
  if (expect.hash !== undefined && (recorded || expect.portFree) && sealed.hash !== expect.hash)
    missed.push(`hash: expected ${expect.hash}, got ${sealed.hash}`);
  if (expect.qr !== undefined && recorded && sealed.qr !== expect.qr)
    missed.push(`qr: expected ${expect.qr}, got ${sealed.qr ?? "none"}`);
  for (const part of expect.payload ?? [])
    if (!sealed.payload.includes(part)) missed.push(`payload: missing ${part}`);
  for (const part of expect.qrContains ?? [])
    if (!sealed.qr?.includes(part)) missed.push(`qr: missing ${part}`);
  return missed;
}

/**
 * Runs one case offline on recorded answers, or against the authority's sandbox when `sandbox` is given.
 *
 * @example
 * const result = await runCertification(CERTIFICATION_CASES[0]);
 * expect(result.mismatches).toEqual([]);
 * // sandbox: the endpoints and seller from config, the host's transport and signer
 * await runCertification(certification, { sandbox: config[certification.id], ports: { transport, signer } });
 */
export async function runCertification(
  certification: CertificationCase,
  run: {
    readonly ports?: Partial<CertificationPorts>;
    readonly sandbox?: CertificationSandbox;
  } = {},
): Promise<CertificationResult> {
  const { recorded: answers, context } = certification;
  const ports: CertificationPorts = {
    signer: new FiscalSignerFake(),
    transport: new FiscalTransportFake([...(answers.answers ?? [])]),
    device: FiscalDeviceFake.with(answers.device ?? {}),
    cipher: new TurnoverCipherFake(),
    credentials: TillCredentialsFake.with(answers.credentials ?? []),
    ...run.ports,
  };
  const recorded = !run.ports && !run.sandbox;
  const driver = certification.driver(ports);
  const options = { ...certification.options, ...run.sandbox?.options };
  const document = {
    ...certification.document,
    seller: { ...certification.document.seller, ...run.sandbox?.seller },
    ...(run.sandbox?.buyer === undefined ? {} : { buyer: run.sandbox.buyer }),
  };
  const sealed = await driver.seal(document, { ...context, options });
  const missed = mismatches(certification, sealed, recorded);
  if (sealed.status !== FiscalRecordStatus.Sealed || (!run.sandbox && !answers.answers?.length))
    return { caseId: certification.id, sealed, mismatches: missed, outcome: null };

  const record: FiscalRecord = {
    unitId: context.unitId,
    sequence: context.sequence,
    market: "certification",
    channel: FiscalChannel.Till,
    driver: driver.key,
    documentId: document.id,
    documentNumber: document.number,
    payload: sealed.payload,
    contentType: sealed.contentType,
    hash: sealed.hash,
    previousHash: context.previous?.hash ?? null,
    signature: sealed.signature,
    qr: sealed.qr,
    marks: sealed.marks,
    sealedAt: context.now,
    status: sealed.status,
    submittedAt: null,
    authorityReference: null,
    message: null,
  };
  const outcome = await driver.submit(record, { unitId: context.unitId, options });
  if (recorded && certification.expect.outcome && outcome.status !== certification.expect.outcome)
    missed.push(`outcome: expected ${certification.expect.outcome}, got ${outcome.status}`);
  return { caseId: certification.id, sealed, mismatches: missed, outcome };
}
