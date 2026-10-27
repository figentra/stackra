/**
 * Stackra file contract:
 * Purpose: `CertificationPorts`, every port a fiscal driver may take, as a certification run hands them over.
 * Boundary: a type only, in the `./testing` entry; `runCertification` fills the ports a caller leaves out with recorded
 *           fakes.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 1 to 4); ADR 0269 (fixtures in the owning package's `./testing`);
 *                     owner decision D3 (2026-10-27): certification pending until a sandbox run passes.
 */
import type { FiscalDevice } from "#contracts/ports/fiscal-device.port";
import type { FiscalSigner } from "#contracts/ports/fiscal-signer.port";
import type { FiscalTransport } from "#contracts/ports/fiscal-transport.port";
import type { TillCredentials } from "#contracts/ports/till-credentials.port";
import type { TurnoverCipher } from "#contracts/ports/turnover-cipher.port";

/** Every port a driver may take; a run fills the ones the caller leaves out with recorded fakes. */
export type CertificationPorts = {
  /** The signer that signs with the unit's key (an HSM, a USB token or a cloud seal). */
  readonly signer: FiscalSigner;

  /** The transport the driver sends authority, ASP and access-point calls through. */
  readonly transport: FiscalTransport;

  /** The fiscal unit outside the till's code (a TSE, a fiscal data module, a telematic printer). */
  readonly device: FiscalDevice;

  /** The cipher that encrypts the till's running turnover counter with the till's own key. */
  readonly cipher: TurnoverCipher;

  /** The per-unit store of the till's fiscal credentials (a CSID, a signing certificate's serial). */
  readonly credentials: TillCredentials;
};
