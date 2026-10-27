/**
 * Stackra file contract:
 * Purpose: `UploadPermissions`, the permissions of the media module's `upload` aggregate: `media.upload.create`, which
 *          `CreateUploadAction` runs under.
 * Boundary: declarations only. Signing an upload stores nothing until the claiming action takes the token, so it is
 *           L1; the bucket's own rules (media types, size) still bound what a holder may put.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 16 and 20); ADR 0132 as amended; ADR 0099 (risk); STA-344.
 */
import { Permission, Permissions } from "@stackra/iam";

/**
 * Referenced as `UploadPermissions.create` by roles and policies.
 *
 * @example
 * roles.grant(StaffRole, [UploadPermissions.create]);
 */
export class UploadPermissions extends Permissions {
  /** Sign an upload to a registered bucket. */
  static readonly create = Permission.L1;
}
