/**
 * Stackra file contract:
 * Purpose: `EcrProfile`, one provider's semi-integrated terminal protocol as data: its operation codes, the order of
 *          the fields in a request and an answer, the separator between them, which result codes mean which
 *          `EcrOutcome`, the link timing, and whether the provider has certified the profile. The parts are
 *          `EcrOperation`, `EcrRequestField` and `EcrResponseField`.
 * Boundary: a type in the leaf entry. A profile is pack data (`market-pack:<code>.payments.terminal-providers`, ADR
 *           0377 decision 8), so a provider's codes and layout are never constants in this package. Amounts travel as
 *           integer minor units; the tip prompt's presets come from the product's tip settings through
 *           `TerminalRequest.tipPrompt`. A profile written from public documentation ships with `certification:
 *           "pending"` until the provider certifies it on its test terminals (a launch-gate row of each pack).
 * Runtime: isomorphic
 * Governing contract: ADR 0377 (decisions 1, 3, 4, 8 and 9); ADR 0220 (integer minor units).
 */
import type { EcrOutcome } from "#contracts/enums/ecr-outcome.enum";
import type { EcrOperation } from "#contracts/types/ecr-operation.type";
import type { EcrRequestField } from "#contracts/types/ecr-request-field.type";
import type { EcrResponseField } from "#contracts/types/ecr-response-field.type";
import type { EcrTiming } from "#contracts/types/ecr-timing.type";

/**
 * A provider's ECR protocol.
 *
 * @example
 * const gateway = new EcrTerminalGateway({ id: till.connectionId, profile: pack.terminalProviders.geidea, link, currency: "SAR" });
 */
export interface EcrProfile {
  /** The provider code (`geidea`, `network-international`), as the pack names it. */
  readonly provider: string;

  /** `pending` until the provider certifies this profile on its test terminals. */
  readonly certification: "pending" | "certified";

  /** The provider's code of each operation it supports; `authorize`, `completion` and `void` together give capture. */
  readonly operations: Readonly<
    Pick<Record<EcrOperation, string>, "sale" | "refund" | "inquiry" | "cancel">
  > &
    Readonly<Partial<Record<"authorize" | "completion" | "void", string>>>;

  /** The text between two fields. */
  readonly separator: string;

  /** The fields of every request, in order; a field an operation does not use is sent empty. */
  readonly request: readonly EcrRequestField[];

  /** The fields of every answer, in order. */
  readonly response: readonly EcrResponseField[];

  /** The provider's result codes and what each means; an unlisted code leaves the payment `unknown`. */
  readonly results: Readonly<Record<string, EcrOutcome>>;

  /** The link's timing for this provider's terminals. */
  readonly timing: EcrTiming;
}
