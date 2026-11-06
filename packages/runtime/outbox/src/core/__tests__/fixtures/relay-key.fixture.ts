/**
 * Stackra file contract:
 * Purpose: test fixture: a fresh Ed25519 relay key pair in the shapes the relay reads, the private key as base64url
 *          PKCS#8 DER (the secret's value) and the public key as raw base64url (a `RelayKey`), a secret store
 *          answering from a map, and the relay and inbox configurations built from values.
 * Boundary: test only; keys are generated per test run and never written anywhere.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0511 (decision 16).
 */
import { buildConfig } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";

import { EventsRelayConfig } from "#config/events-relay.config";
import { RelayInboxConfig } from "#config/relay-inbox.config";
import type { ProducerKeys, RelayKey, Subscriber } from "#contracts/index";

/** A generated relay key: the secret value that signs and the public key that verifies. */
export interface RelayKeyPair {
  readonly secret: string;
  readonly key: RelayKey;
}

/** `bytes` as base64url without padding. */
function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCodePoint(...new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

/** A fresh key pair named `id`. */
export async function relayKeyPair(id: string): Promise<RelayKeyPair> {
  const pair = (await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  return {
    secret: base64url(await crypto.subtle.exportKey("pkcs8", pair.privateKey)),
    key: { id, publicKey: base64url(await crypto.subtle.exportKey("raw", pair.publicKey)) },
  };
}

/** A secret store answering from a map, counting its reads. */
export class MapSecretStore extends SecretStore {
  /** How many times a secret was read. */
  reads = 0;

  /** Secret name to value. */
  private readonly values: Readonly<Record<string, string>>;

  constructor(values: Readonly<Record<string, string>>) {
    super();
    this.values = values;
  }

  get(name: string): string | undefined {
    this.reads += 1;
    return this.values[name];
  }
}

/** A secret store answering from `values`. */
export function secretsOf(values: Readonly<Record<string, string>>): MapSecretStore {
  return new MapSecretStore(values);
}

/** The producer's relay configuration with `values`. */
export function relayConfig(values: {
  readonly signingKey?: string;
  readonly keys?: readonly RelayKey[];
  readonly subscribers?: readonly Subscriber[];
}): EventsRelayConfig {
  return buildConfig(EventsRelayConfig, {
    values: {
      ...values,
      keys: [...(values.keys ?? [])],
      subscribers: [...(values.subscribers ?? [])],
    },
  });
}

/** The consumer's inbox configuration pinning `producers`, running in `environment`. */
export function inboxConfig(producers: ProducerKeys, environment = "dev"): RelayInboxConfig {
  return buildConfig(RelayInboxConfig, { values: { producers, environment } });
}
