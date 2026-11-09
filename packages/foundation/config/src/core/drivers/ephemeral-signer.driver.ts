/**
 * Stackra file contract:
 * Purpose: the `ephemeral` driver of @stackra/contracts' `Signer` port: ES256 signatures with an ECDSA P-256 key pair
 *          generated in process on first use, for tests and local development of a service that injects `Signer`.
 * Boundary: the container's twin of @stackra/contracts' `MemorySignerDriver`, which this driver delegates to. The
 *           private key is non-extractable and lives only as long as the process, so a signature made before a
 *           restart no longer matches `publicKey()` after it: never bind this driver where a signature must outlive
 *           the process. Production binds `kms`. The key id is `SignerConfig.keyId`, or `ephemeral` when empty.
 * Runtime: isomorphic
 * Governing contract: ADR 0416; ADR 0266 (memory first); ADR 0263 (a driver is named by its file: `ephemeral`).
 */
import { Driver } from "@stackra/container";
import { MemorySignerDriver, Signer } from "@stackra/contracts";
import type { Signature, SignerPublicKey } from "@stackra/contracts";

import type { SignerConfig } from "#config/signer.config";

/** The key id when the config names none. */
const DEFAULT_KEY_ID = "ephemeral";

/**
 * Signs with a key pair made for this process.
 *
 * @example
 * const signer = new EphemeralSignerDriver(buildConfig(SignerConfig, { values: {} }));
 * const signature = await signer.sign(bytes);
 */
export class EphemeralSignerDriver extends Driver(Signer, { testDefault: true }) {
  private readonly config: SignerConfig;

  /** The contracts driver over the generated key pair, once made. */
  private delegate: Promise<MemorySignerDriver> | undefined;

  /**
   * @param config - the id signatures name.
   */
  constructor(config: SignerConfig) {
    super();
    this.config = config;
  }

  /** A detached ES256 signature of `message`. */
  async sign(message: Uint8Array): Promise<Signature> {
    return (await this.signer()).sign(message);
  }

  /** The public key of this process's key pair. */
  async publicKey(): Promise<SignerPublicKey> {
    return (await this.signer()).publicKey();
  }

  /** The delegate, generating the key pair on first use. */
  private signer(): Promise<MemorySignerDriver> {
    this.delegate ??= MemorySignerDriver.generate(
      this.config.keyId === "" ? DEFAULT_KEY_ID : this.config.keyId,
    );
    return this.delegate;
  }
}
