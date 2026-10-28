/**
 * Stackra file contract:
 * Purpose: `Refusal`, the kind base of every error a member raises on purpose: `class OrderNotPayableError extends
 *          Refusal({ kind: ErrorKind.Conflict, retryable: false })`, whose fields are the envelope's details. The
 *          interface of the same name is its instance side.
 * Boundary: called only (ADR 0305 rule 2): a refusal needs its kind, so a bare `extends Refusal` fails to compile. A
 *           refusal is an `Error` (it throws with a stack) built with `X.create(details)`, never `new`. Its code is
 *           derived from the class name by `refusalCode`, the function gen also uses; its category, status and default
 *           retry flag come from the kind. The kind base keeps no state of its own: the kind and options are in the
 *           kind registry, and the code, category and details are read on demand. `isRefusal` recognises a refusal by
 *           a registry symbol on the prototype, so a refusal from another bundle still counts.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 25), ADR 0305 (rules 2 and 3), ADR 0140 (envelope and kinds),
 *                     ADR 0232 (decision 2).
 */
import { createKind, kindOf } from "@stackra/container";
import { Enum } from "@stackra/contracts";

import { REFUSAL_BRAND } from "#core/constants/refusal-brand.constant";
import { ErrorKind } from "#core/enums/error-kind.enum";
import { refusalCode } from "#core/functions/refusal-code.function";
import type { ErrorCategory } from "#core/types/error-category.type";
import type { ErrorEnvelope } from "#core/types/error-envelope.type";
import type { FieldErrors } from "#core/types/field-errors.type";
import type { RefusalClass } from "#core/types/refusal-class.type";
import type { RefusalOptions } from "#core/types/refusal-options.type";

/** The instance side every refusal shares. Its own fields are the details and must not reuse these names. */
export interface Refusal extends Error {
  /** Type-only kind brand, so a class of another kind cannot stand in for a refusal. */
  readonly "~kind": "refusal";

  /** The kind the class declared. */
  readonly kind: ErrorKind;

  /** The snake_case code derived from the class name (`order_not_payable`). */
  readonly code: string;

  /** The envelope category of the kind. */
  readonly category: ErrorCategory;

  /** The class's `retryable` option, else the kind's default. */
  readonly retryable: boolean;

  /** The declared fields that were set, frozen. */
  readonly details: Readonly<Record<string, unknown>>;

  /** The refused input paths and why, when `create` was given them. */
  readonly fieldErrors?: FieldErrors;

  /**
   * The wire form of this refusal (ADR 0140). The call's trace and action key are added by whoever sends it.
   *
   * @example
   * response.json(refusal.toEnvelope({ correlationId: trace.id, action: "orders.order.cancel@1" }));
   */
  toEnvelope: (context?: {
    readonly correlationId?: string;
    readonly action?: string;
  }) => ErrorEnvelope;
}

/** The options a refusal's class was declared with, from the kind registry. */
function optionsOf(refusal: object): RefusalOptions {
  const options = kindOf(refusal.constructor)?.options as RefusalOptions | undefined;
  if (options?.kind === undefined)
    throw new TypeError(`${refusal.constructor.name} does not extend Refusal({ kind })`);
  return options;
}

/** The runtime base. Not exported: authors extend `Refusal({ ... })`. */
class RefusalBase extends Error {
  declare readonly "~kind": "refusal";

  declare readonly fieldErrors?: FieldErrors;

  /** See `RefusalClass.create`. */
  static create(
    this: new () => RefusalBase,
    details: object = {},
    extras: { readonly fieldErrors?: FieldErrors; readonly cause?: unknown } = {},
  ): RefusalBase {
    const refusal = new this();
    Object.assign(refusal, details);
    // Non-enumerable, so they never count as details.
    if (extras.fieldErrors !== undefined)
      Object.defineProperty(refusal, "fieldErrors", {
        value: Object.freeze({ ...extras.fieldErrors }),
      });
    if (extras.cause !== undefined)
      Object.defineProperty(refusal, "cause", {
        value: extras.cause,
        writable: true,
        configurable: true,
      });
    return refusal;
  }

  /** See `RefusalClass.envelope`. */
  static envelope(this: new () => RefusalBase, details?: object): ErrorEnvelope {
    return RefusalBase.create.call(this, details).toEnvelope();
  }

  get kind(): ErrorKind {
    return optionsOf(this).kind;
  }

  get code(): string {
    return refusalCode(this.constructor.name);
  }

  get category(): ErrorCategory {
    return Enum.meta(ErrorKind, this.kind).category;
  }

  get retryable(): boolean {
    return optionsOf(this).retryable ?? Enum.meta(ErrorKind, this.kind).retryable;
  }

  get details(): Readonly<Record<string, unknown>> {
    return Object.freeze(
      Object.fromEntries(Object.entries(this).filter(([, value]) => value !== undefined)),
    );
  }

  toEnvelope(
    context: { readonly correlationId?: string; readonly action?: string } = {},
  ): ErrorEnvelope {
    const details = this.details;
    return {
      code: this.code,
      category: this.category,
      retryable: this.retryable,
      ...(Object.keys(details).length > 0 ? { details } : {}),
      ...(this.fieldErrors === undefined ? {} : { fieldErrors: this.fieldErrors }),
      ...(context.correlationId === undefined ? {} : { correlationId: context.correlationId }),
      ...(context.action === undefined ? {} : { action: context.action }),
    };
  }
}

// `name` and `message` are data properties on `Error`, so TypeScript refuses accessors for them in the class body.
Object.defineProperties(RefusalBase.prototype, {
  [REFUSAL_BRAND]: { value: true },
  name: {
    get(this: RefusalBase): string {
      return this.constructor.name;
    },
  },
  message: {
    get(this: RefusalBase): string {
      // A bad class name must not hide the error being printed.
      try {
        return this.code;
      } catch {
        return this.constructor.name;
      }
    },
  },
});

/**
 * The refusal kind base.
 *
 * @example
 * export class InsufficientPointsError extends Refusal({
 *   kind: ErrorKind.FailedPrecondition,
 *   retryable: false,
 * }) {
 *   balance!: number;
 *   requested!: number;
 * }
 *
 * throw InsufficientPointsError.create({ balance, requested: points });
 */
export const Refusal = createKind("refusal", RefusalBase, (options: RefusalOptions) => {
  if (!Enum.values(ErrorKind).includes(options?.kind))
    throw new RangeError(
      `Refusal({ kind }) needs a kind from ErrorKind, got ${JSON.stringify(options?.kind)}`,
    );
  return { ...options };
}) as (options: RefusalOptions) => RefusalClass;
