/**
 * Stackra file contract:
 * Purpose: `RestrictedTenderService`, the restricted-tender kind (EBT SNAP, meal vouchers) over `PaymentService`:
 *          line eligibility by the program's rule set, the split between the restricted tender and an ordinary one,
 *          tax waived on the restricted part where the pack says so, the restricted part presented on a terminal with
 *          a PIN step or opened as a hosted checkout, and capture at fulfilment against the picked basket (weight
 *          changes and substitutions re-split it).
 * Boundary: generic over `RestrictedTenderPrograms` (pack data), `TenderEligibility` (the rules engine) and
 *           `PaymentRecords`; every payment goes through `PaymentService`, so the `unknown` state, one payment per
 *           reference and the provider choice are unchanged. The remainder is the product's to take with an ordinary
 *           tender under its own reference. No program, Market, category or tax rate is named here.
 * Runtime: isomorphic
 * Governing contract: ADR 0445; ADR 0357 (decisions 2, 5 and 6); R3-SO-08; GRO-182; GRO-186.
 */
import { Service } from "@stackra/container";
import { NotFoundError } from "@stackra/errors";
import type { Money } from "@stackra/money";

import { TenderKind } from "#contracts/enums/tender-kind.enum";
import type { PaymentRecords } from "#contracts/ports/payment-records.port";
import type { RestrictedTenderPrograms } from "#contracts/ports/restricted-tender-programs.port";
import type { TenderEligibility } from "#contracts/ports/tender-eligibility.port";
import type { CheckoutRequest } from "#contracts/types/checkout-request.type";
import type { CheckoutSession } from "#contracts/types/checkout-session.type";
import type { PaymentRecord } from "#contracts/types/payment-record.type";
import type { RestrictedTenderProgram } from "#contracts/types/restricted-tender-program.type";
import type { TenderLine } from "#contracts/types/tender-line.type";
import type { TenderSplit } from "#contracts/types/tender-split.type";
import type { TerminalSession } from "#contracts/types/terminal-session.type";
import { InvalidPaymentTransitionError } from "#core/errors/invalid-payment-transition.error";
import { NoEligibleLinesError } from "#core/errors/no-eligible-lines.error";
import { RestrictedTenderUnavailableError } from "#core/errors/restricted-tender-unavailable.error";
import { splitTender } from "#core/functions/split-tender.function";
import type { PaymentService } from "#core/services/payment.service";

/** The basket a restricted tender pays from. */
interface RestrictedBasket {
  /** The merchant's id of the restricted payment; the remainder takes its own. */
  readonly reference: string;

  /** The program code the Market's pack lists. */
  readonly program: string;

  /** The whole basket; the rule set picks the eligible lines. */
  readonly lines: readonly TenderLine[];

  /** What the tender holds, when the processor reported it. */
  readonly balance?: Money;
}

/** A hosted restricted-tender checkout: the basket plus the page fields of `CheckoutRequest`. */
type RestrictedCheckout = RestrictedBasket &
  Pick<
    CheckoutRequest,
    "description" | "returnUrl" | "cancelUrl" | "customer" | "locale" | "expiresAt"
  >;

/**
 * Restricted tenders. Inject it by class.
 *
 * @example
 * const { split, session } = await tenders.startTerminal(market, { reference, terminalId, program: "snap", lines });
 * // split.remainder goes on a card under another reference
 */
export class RestrictedTenderService extends Service {
  /** Every payment goes through the engine. */
  private readonly payments: PaymentService;

  /** The Market's programs. */
  private readonly programs: RestrictedTenderPrograms;

  /** The rule-set evaluation. */
  private readonly eligibility: TenderEligibility;

  /** The engine's payment state, read to bound a capture. */
  private readonly records: PaymentRecords;

  /**
   * @param payments - the engine.
   * @param programs - the `market-pack` driver in a host; the memory driver in tests.
   * @param eligibility - the host's rules driver; the memory driver in tests.
   * @param records - the same store `PaymentService` writes.
   */
  constructor(
    payments: PaymentService,
    programs: RestrictedTenderPrograms,
    eligibility: TenderEligibility,
    records: PaymentRecords,
  ) {
    super();
    this.payments = payments;
    this.programs = programs;
    this.eligibility = eligibility;
    this.records = records;
  }

  /**
   * The split of `lines` between program `program` of `market` and an ordinary tender.
   *
   * @throws RestrictedTenderUnavailableError when the Market does not offer the program.
   */
  async split(
    market: string,
    program: string,
    lines: readonly TenderLine[],
    balance?: Money,
  ): Promise<TenderSplit> {
    return (await this.splitOf(market, program, lines, balance)).split;
  }

  /**
   * Presents the restricted part of the basket on a terminal as a `restricted` tender, with the program's PIN step;
   * it is authorised only when the program captures at fulfilment.
   *
   * @throws RestrictedTenderUnavailableError when the Market does not offer the program.
   * @throws NoEligibleLinesError when the tender has nothing to pay.
   * @throws NoPaymentProviderError when no provider of the Market takes the program (or the PIN step) on a terminal.
   */
  async startTerminal(
    market: string,
    request: RestrictedBasket & { readonly terminalId: string },
  ): Promise<{ readonly split: TenderSplit; readonly session: TerminalSession }> {
    const { program, split } = await this.payable(market, request);
    const session = await this.payments.startTerminal(market, {
      reference: request.reference,
      terminalId: request.terminalId,
      amount: split.restricted,
      tender: TenderKind.Restricted,
      program: program.code,
      pinEntry: program.pinEntry,
      captureLater: program.captureAtFulfilment,
    });
    return { split, session };
  }

  /**
   * Opens a hosted checkout (the processor's page and PIN pad) for the restricted part of the basket, authorise-only
   * when the program captures at fulfilment.
   *
   * @throws RestrictedTenderUnavailableError when the Market does not offer the program.
   * @throws NoEligibleLinesError when the tender has nothing to pay.
   */
  async checkout(
    market: string,
    request: RestrictedCheckout,
  ): Promise<{ readonly split: TenderSplit; readonly session: CheckoutSession }> {
    const { program, split } = await this.payable(market, request);
    const session = await this.payments.checkout(market, {
      reference: request.reference,
      description: request.description,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
      ...(request.customer === undefined ? {} : { customer: request.customer }),
      ...(request.locale === undefined ? {} : { locale: request.locale }),
      ...(request.expiresAt === undefined ? {} : { expiresAt: request.expiresAt }),
      amount: split.restricted,
      lines: request.lines.filter((_line, index) => split.eligible.includes(index)),
      tender: TenderKind.Restricted,
      program: program.code,
      captureLater: program.captureAtFulfilment,
    });
    return { split, session };
  }

  /**
   * Captures an authorised restricted payment against the basket as picked: the basket is split again and the
   * restricted part, never more than was authorised, is captured; a picked basket with nothing eligible voids it.
   *
   * @throws RestrictedTenderUnavailableError when the Market does not offer the program.
   * @throws InvalidPaymentTransitionError when the program does not capture at fulfilment.
   * @throws NotFoundError when the reference has no record.
   */
  async captureAtFulfilment(
    market: string,
    request: RestrictedBasket,
  ): Promise<{ readonly split: TenderSplit; readonly record: PaymentRecord }> {
    const record = await this.records.find(request.reference);
    if (record === null) throw NotFoundError.create();
    const { program, split } = await this.splitOf(
      market,
      request.program,
      request.lines,
      request.balance,
    );
    if (!program.captureAtFulfilment)
      throw InvalidPaymentTransitionError.create({
        reference: request.reference,
        status: record.status,
        operation: "capture_at_fulfilment",
      });
    if (split.restricted.minor <= 0)
      return { split, record: await this.payments.void(request.reference) };
    const amount = split.restricted.minor < record.amount.minor ? split.restricted : record.amount;
    return { split, record: await this.payments.capture(request.reference, amount) };
  }

  /**
   * The program and the split, refusing a tender with nothing to pay.
   *
   * @throws NoEligibleLinesError when the restricted part is zero.
   */
  private async payable(
    market: string,
    request: RestrictedBasket,
  ): Promise<{ readonly program: RestrictedTenderProgram; readonly split: TenderSplit }> {
    const found = await this.splitOf(market, request.program, request.lines, request.balance);
    if (found.split.restricted.minor <= 0)
      throw NoEligibleLinesError.create({ reference: request.reference, program: request.program });
    return found;
  }

  /**
   * The program of `market` and the split of `lines` by its rule set.
   *
   * @throws RestrictedTenderUnavailableError when the Market does not offer the program.
   */
  private async splitOf(
    market: string,
    code: string,
    lines: readonly TenderLine[],
    balance: Money | undefined,
  ): Promise<{ readonly program: RestrictedTenderProgram; readonly split: TenderSplit }> {
    const program = await this.programs.program(market, code);
    if (program === undefined)
      throw RestrictedTenderUnavailableError.create({ market, program: code });
    const eligible = await this.eligibility.eligible(market, program.ruleSet, lines);
    return { program, split: splitTender(program, lines, eligible, balance) };
  }
}
