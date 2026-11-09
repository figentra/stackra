/**
 * Stackra file contract:
 * Purpose: the `PushRegistration` client port: asks this device for the push permission and, when it is granted,
 *          registers the device's push target with the notifications service, for `PushPrimer`.
 * Boundary: an abstract class that is its own token. An app binds it to the platform's permission request and its
 *           generated client; it acts on the signed-in person, so it takes no principal id. A repeated
 *           `idempotencyKey` registers the device once. A refusal by the person is an answer (`denied`), not an
 *           error; an error means the registration failed. `MemoryPushRegistrationDriver` in `./testing`.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0263 (ports and drivers); ADR 0223 (decision 1); ADR 0138
 *                     (idempotency).
 */
import { Port } from "@stackra/contracts";

import type { PrimerTrigger } from "#contracts/types/primer-trigger.type";
import type { PushPermission } from "#contracts/types/push-permission.type";

/**
 * Turns push on for this device.
 *
 * @example
 * const permission = await useContainer().get(PushRegistration).register({ trigger: "onboarding" });
 */
export abstract class PushRegistration extends Port {
  /** Asks for the permission and, once granted, registers the device; answers where the permission stands. */
  abstract register(input: {
    readonly trigger: PrimerTrigger;
    readonly idempotencyKey?: string | undefined;
  }): Promise<PushPermission>;
}
