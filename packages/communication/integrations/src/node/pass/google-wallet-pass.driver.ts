/**
 * Stackra file contract:
 * Purpose: `GoogleWalletPassDriver`, the Google Wallet `WalletPassIssuer`: it writes the pass's `genericObject`
 *          through the Wallet API (insert, or update when the object exists) and answers the "Add to Google Wallet"
 *          save link, a JWT signed by the issuer's service account that names the object.
 * Boundary: the API calls go through `api`, the managed client of the host's Google Wallet Integration, which
 *           authenticates with the service-account JWT bearer grant (`AuthType.OAuth2JwtBearer`, scope
 *           `https://www.googleapis.com/auth/wallet_object.issuer`); the vendor Integration itself is an OS connector
 *           (R3-8), so this driver never builds a request or holds a token. The save link is signed with the key read
 *           by name from the `SecretStore` at each call and never logged. Abstract: the host's subclass declares `api`
 *           and `options`, and the constructor takes only the injected `SecretStore` (ADR 0294 rule 17). Not yet certified against a live issuer
 *           account (STA-791 acceptance: the save link works).
 * Runtime: node
 * Governing contract: ADR 0348 (decision 5); ADR 0308 (rules 6 and 13); RFC 7523; Google Wallet API "Save link".
 */
import type { SecretStore } from "@stackra/config/contracts";
import { Driver } from "@stackra/container";

import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { signJwt } from "#core/functions/sign-jwt.function";
import type { IntegrationApi } from "#core/types/integration-api.type";
import { googleWalletObject } from "#node/pass/google-wallet-object.function";
import type { GoogleWalletOptions } from "#node/pass/google-wallet-options.type";
import type { IssuedWalletPass } from "#node/pass/issued-wallet-pass.type";
import { WalletPassIssuer } from "#node/pass/wallet-pass-issuer.port";
import type { WalletPassRequest } from "#node/pass/wallet-pass-request.type";

/** The Wallet API path of generic objects, relative to the Integration's `https://walletobjects.googleapis.com`. */
const OBJECTS = "/walletobjects/v1/genericObject";

/** Where a save link opens. */
const SAVE_URL = "https://pay.google.com/gp/v/save/";

/**
 * Issues Google Wallet passes.
 *
 * @example
 * export class ShopGoogleWalletPassDriver extends GoogleWalletPassDriver {
 *   protected override readonly api = googleWallet.api;
 *   protected override readonly options = { issuerId, classId, serviceAccountEmail };
 * }
 * const { saveUrl } = await new ShopGoogleWalletPassDriver(secrets).issue(request);
 */
export abstract class GoogleWalletPassDriver extends Driver(WalletPassIssuer) {
  /** The Google Wallet Integration's API, declared by the host's subclass. */
  protected abstract readonly api: IntegrationApi;

  /** The deployment's Google Wallet data, declared by the host's subclass. */
  protected abstract readonly options: GoogleWalletOptions;

  private readonly secrets: SecretStore;

  /**
   * @param secrets - holds the issuer's signing key.
   */
  constructor(secrets: SecretStore) {
    super();
    this.secrets = secrets;
  }

  /**
   * The object written and its save link.
   *
   * @throws ProviderRefusedError when the Wallet API refuses the object (other than "it exists").
   * @throws ProviderUnavailableError when the Wallet API does not answer.
   * @throws TypeError when the signing key's secret is not set.
   */
  async issue(request: WalletPassRequest): Promise<IssuedWalletPass> {
    const object = googleWalletObject(request, this.options);
    try {
      await this.api.post(OBJECTS, object, { idempotencyKey: object.id });
    } catch (error) {
      if (!ProviderRefusedError.is(error, { status: 409 })) throw error;
      await this.api.put(`${OBJECTS}/${encodeURIComponent(object.id)}`, object);
    }
    const keyName = this.options.keySecret ?? "GOOGLE_WALLET_ISSUER_KEY";
    const key = this.secrets.get(keyName);
    if (key === undefined || key === "")
      throw new TypeError(`the Google Wallet signing secret ${keyName} is not set`);
    const token = await signJwt(
      {
        algorithm: "RS256",
        key: "{privateKey}",
        issuer: this.options.serviceAccountEmail,
        audience: "google",
        expiresIn: this.options.saveLinkLifetime ?? "1d",
      },
      (template) => (template === "{privateKey}" ? key : template),
      request.issuedAt,
      // signJwt types extra claims as strings; the save link's payload is an object, written as JSON all the same.
      {
        typ: "savetowallet",
        origins: [],
        payload: { genericObjects: [{ id: object.id }] },
      } as unknown as Readonly<Record<string, string>>,
    );
    return {
      provider: "google_wallet",
      serial: request.content.serial,
      objectId: object.id,
      saveUrl: `${SAVE_URL}${token}`,
    };
  }
}
