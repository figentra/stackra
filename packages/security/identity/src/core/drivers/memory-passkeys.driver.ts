/**
 * Stackra file contract:
 * Purpose: `MemoryPasskeysDriver`, a `Passkeys` over credentials held in memory, for tests, web and local runs:
 *          registration stores a credential per relying party, sign-in answers with one of them.
 * Boundary: process-local and unsigned: the response fields are placeholders no provider accepts, so it is never a
 *           production source. `supported` switches the device off; `refuseNext` makes the next call refuse once, as
 *           the system sheet does when the person closes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0206 (decision 8); STA-1538.
 */
import { Driver } from "@stackra/container";

import { PasskeyRefusal, Passkeys } from "#contracts/index";
import type {
  PasskeyCreationOptions,
  PasskeyCredential,
  PasskeyRequestOptions,
  PasskeyResult,
} from "#contracts/index";

/**
 * Passkeys held in memory.
 *
 * @example
 * const passkeys = new MemoryPasskeysDriver();
 * await passkeys.register(creationOptions);
 * passkeys.refuseNext(PasskeyRefusal.Cancelled);
 * expect(await passkeys.authenticate(requestOptions)).toEqual({ ok: false, error: "cancelled" });
 */
export class MemoryPasskeysDriver extends Driver(Passkeys) {
  /** Whether this pretend device can use passkeys. */
  supported = true;

  /** The credential ids registered per relying party id. */
  private readonly credentials = new Map<string, string[]>();

  /** The refusal the next call answers, once. */
  private refusal: PasskeyRefusal | null = null;

  /** Whether this pretend device can use passkeys. */
  isSupported(): boolean {
    return this.supported;
  }

  /**
   * Makes the next `register` or `authenticate` refuse with `refusal`, once.
   *
   * @returns this driver, to chain.
   */
  refuseNext(refusal: PasskeyRefusal): this {
    this.refusal = refusal;
    return this;
  }

  /** Stores a new credential for `options.rp.id`, unless one in `excludeCredentials` is already here. */
  register(options: PasskeyCreationOptions): Promise<PasskeyResult> {
    const refused = this.refused();
    if (refused) return Promise.resolve(refused);
    const held = this.credentials.get(options.rp.id) ?? [];
    if (options.excludeCredentials?.some((excluded) => held.includes(excluded.id))) {
      return Promise.resolve({ ok: false, error: PasskeyRefusal.AlreadyRegistered });
    }
    const id = `memory-passkey-${held.length + 1}`;
    this.credentials.set(options.rp.id, [...held, id]);
    return Promise.resolve({
      ok: true,
      data: credential(id, { clientDataJSON: options.challenge, attestationObject: "memory" }),
    });
  }

  /** Answers with the first credential for `options.rpId` that `allowCredentials` allows. */
  authenticate(options: PasskeyRequestOptions): Promise<PasskeyResult> {
    const refused = this.refused();
    if (refused) return Promise.resolve(refused);
    const allowed = options.allowCredentials?.map((allow) => allow.id);
    const id = (this.credentials.get(options.rpId) ?? []).find(
      (held) => allowed === undefined || allowed.includes(held),
    );
    if (id === undefined) return Promise.resolve({ ok: false, error: PasskeyRefusal.NoCredential });
    return Promise.resolve({
      ok: true,
      data: credential(id, {
        clientDataJSON: options.challenge,
        authenticatorData: "memory",
        signature: "memory",
      }),
    });
  }

  /** The refusal this call answers: unsupported, or the one `refuseNext` set; `null` to go on. */
  private refused(): PasskeyResult | null {
    if (!this.supported) return { ok: false, error: PasskeyRefusal.Unsupported };
    const refusal = this.refusal;
    this.refusal = null;
    return refusal === null ? null : { ok: false, error: refusal };
  }
}

/** A platform credential with `id` and the placeholder `response`. */
function credential(id: string, response: PasskeyCredential["response"]): PasskeyCredential {
  return { id, rawId: id, type: "public-key", authenticatorAttachment: "platform", response };
}
