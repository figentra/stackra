/**
 * Stackra file contract:
 * Purpose: `IdpMachineUserInput`, what `IdpAdmin.createMachineUser` takes: the organisation, the machine's login name
 *          and a human-readable name and description (a device, an integration, a service).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0207 (machine identities); ADR 0235 (decision 1); ADR 0410 (STA-834).
 */

/** A machine user to create. */
export interface IdpMachineUserInput {
  /** The identity provider's organisation id. */
  readonly organizationId: string;

  /** The login name, unique in the organisation (`device_till_7`). */
  readonly username: string;

  /** The display name. */
  readonly name: string;

  /** What the machine is for. */
  readonly description?: string;
}
