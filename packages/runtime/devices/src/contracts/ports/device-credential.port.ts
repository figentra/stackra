/**
 * Stackra file contract:
 * Purpose: the `DeviceCredential` port: the access token a device presents to the hub on every call.
 * Boundary: an abstract class that is its own token. Identity binds its driver: the token comes from the OAuth device
 *           flow or client credentials (ADR 0235 decision 1, ADR 0207); an mTLS device answers `undefined` and its
 *           certificate rides on the connection. This package never stores, logs or refreshes a token.
 * Runtime: isomorphic
 * Governing contract: ADR 0235 (decision 1); ADR 0207 (machine identities); ADR 0294 (decisions 15, 16 and 17).
 */
import { Port } from "@stackra/contracts";

/**
 * Supplies the device's token.
 *
 * @example
 * export class ZitadelDeviceCredentialDriver extends Driver(DeviceCredential) {
 *   token(): Promise<string | undefined> {
 *     return this.session.accessToken();
 *   }
 * }
 */
export abstract class DeviceCredential extends Port {
  /** The current access token, sent as `Authorization: Bearer`; `undefined` sends none. */
  abstract token(): Promise<string | undefined>;
}
