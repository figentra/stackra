/**
 * Stackra file contract:
 * Purpose: `Permission`, the value of one static on a `<Model>Permissions` class: its risk level (`Permission.L2`),
 *          whether it is a system permission no role may grant (`Permission.L2.system()`), and whether it is a
 *          restricted permission a principal can never grant itself (`Permission.L3.restricted()`).
 * Boundary: a frozen value. Each `Permission.Lx` read and each `.system()` call returns a new instance, so every static
 *           is its own object and `registerPermissions` can give each one its locked key (`permissionKey`). The value
 *           holds no key: the key is derived by gen from the module, the class and the static (ADR 0294 decision 20).
 * Runtime: isomorphic
 * Governing contract: ADR 0132 (as amended by 0294: `static readonly cancel = Permission.L2`); ADR 0099 (as amended:
 *                     the level lives on the permission); ADR 0208 (0294 note: a system permission is never granted).
 */
import { Risk } from "#core/enums/risk.enum";

/**
 * A permission's level and grantability.
 *
 * @example
 * export class OrderPermissions extends Permissions {
 *   static readonly cancel = Permission.L2;
 *   static readonly expire = Permission.L2.system();
 * }
 */
export class Permission {
  /** The level an action or a query using this permission takes. */
  readonly risk: Risk;

  /** Held only by the platform (system and job actors); no role may grant it. */
  readonly isSystem: boolean;

  /** Counts only through a grant someone else made: never self-granted (safeguarding, medical, client funds). */
  readonly isRestricted: boolean;

  private constructor(risk: Risk, isSystem: boolean, isRestricted = false) {
    this.risk = risk;
    this.isSystem = isSystem;
    this.isRestricted = isRestricted;
    Object.freeze(this);
  }

  /** Informational: no data read beyond public context. */
  static get L0(): Permission {
    return new Permission(Risk.L0, false);
  }

  /** Read. */
  static get L1(): Permission {
    return new Permission(Risk.L1, false);
  }

  /** Reversible write. */
  static get L2(): Permission {
    return new Permission(Risk.L2, false);
  }

  /** Financial. */
  static get L3(): Permission {
    return new Permission(Risk.L3, false);
  }

  /** Privileged or destructive. */
  static get L4(): Permission {
    return new Permission(Risk.L4, false);
  }

  /**
   * The same level as a system permission, held only by the platform.
   *
   * @example
   * static readonly expire = Permission.L2.system();
   */
  system(): Permission {
    return new Permission(this.risk, true, this.isRestricted);
  }

  /**
   * The same level as a restricted permission: a grant of a role holding it counts only when a principal other than
   * the holder made it, and nobody may delegate it to themself.
   *
   * @example
   * static readonly readMedical = Permission.L3.restricted();
   */
  restricted(): Permission {
    return new Permission(this.risk, this.isSystem, true);
  }
}
