/**
 * Stackra file contract:
 * Purpose: `AccessRole`, the shape of a person's sign-in role in an account, reached through AWS Account Access
 *          Manager.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: people sign in through Identity Center, no IAM users), ADR 0524.
 */

/** One sign-in role. */
export interface AccessRole {
  /** The role name, e.g. `Admin`. */
  readonly name: string;
  /** The IAM path, e.g. `/acme/`. */
  readonly path: string;
  /** Managed policies attached, e.g. `arn:aws:iam::aws:policy/ReadOnlyAccess`. */
  readonly policyArns: readonly string[];
  /** Inline policy documents by name, e.g. `{ NoSecretReads: {…} }`. */
  readonly inline?: Readonly<Record<string, object>>;
  /** The longest session, in seconds (3600 to 43200). */
  readonly maxSessionSeconds: number;
  /** Tags on the role, for access policies and cost reports. */
  readonly tags?: Readonly<Record<string, string>>;
}
