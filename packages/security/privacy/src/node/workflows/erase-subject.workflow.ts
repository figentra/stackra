/**
 * Stackra file contract:
 * Purpose: `EraseSubjectWorkflow`, the erasure saga (GDPR Art. 17, PDPL Art. 4 right to destruction): `erase` deletes
 *          or anonymises the subject's rows of every registered `PersonalData` declaration that no legal hold covers,
 *          `redact` nulls the declared personal fields in the outbox messages still held that name the subject (a
 *          late delivery or a dead-letter replay would carry them otherwise) and counts the ones it found but could
 *          not rewrite (a platform message, which the subject's tenant may not change) as the receipt's
 *          `unredacted`, so an incomplete erasure never reads as complete (STA-2629), `shred` destroys the subject
 *          key's salt
 *          so every shredded field is unreadable, and `receipt` records
 *          `SubjectErased` (and the `ServiceAcked` a cross-service erasure waits on) with what was disposed of and kept.
 *          The unredacted messages reach every reader of completeness: `SubjectErased.unredacted`, and a `kept` entry
 *          (`outbox.message`, reason `unredacted`) on the receipt, `SubjectErased` and the `ServiceAcked`, so the
 *          waiting service's `AllServicesAcked` shows them; above zero `receipt` also logs a warning
 *          (`privacy.erasure_unredacted`, the erasure id and the count only).
 * Boundary: the public async methods are the steps, run in declaration order, each its own transaction. Holds are
 *           asked through `disposableIds` before anything is touched (`delete` for a row with a delete field, `edit`
 *           otherwise), and held rows are kept and counted. The key is shredded only when no held row carries a
 *           shredded field, since shredding would destroy what the hold preserves; the receipt says which. Erasure is
 *           not undone, so no step has an undo. Started only by `EraseSubjectAction` through `ctx.run`. Before touching
 *           anything, `erase` refuses when a declared `Shred` field is not sealed under the subject's key
 *           (`unsealedShredFields`): destroying the salt would leave it readable and the receipt would be false.
 * Runtime: node
 * Governing contract: ADR 0189 (decisions 2 and 4); ADR 0134 (legal holds); ADR 0212 (crypto-shredding); ADR 0210
 *                     (decision 6: `ServiceAcked`); ADR 0294 (decisions 16 and 18); ADR 0151; STA-1312; STA-1375; gap
 *                     gov2 (stackra-263); gap gov6 (the outbox redaction, stackra-275).
 */
import type { Container } from "@stackra/container";
import { Logger } from "@stackra/contracts";
import { Disposal } from "@stackra/database/contracts";
import { disposableIds } from "@stackra/database";
import { redactSubjectMessages } from "@stackra/outbox";
import type { OutboxDriver, SubjectRedaction } from "@stackra/outbox/contracts";
import {
  type Run,
  ServiceAcked,
  type StepContext,
  Workflow,
  type KeptRecords,
} from "@stackra/workflow";

import { ErasureMethod } from "#contracts/enums/erasure-method.enum";
import type { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import type { SubjectSaltStore } from "#contracts/ports/subject-salt-store.port";
import type { ErasedRecords } from "#contracts/types/erased-records.type";
import { SubjectErased } from "#core/events/subject-erased.event";
import { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";
import { unsealedShredFields } from "#node/functions/unsealed-shred-fields.function";
import type { EraseSubjectInput } from "#node/schemas/erase-subject-input.schema";
import { EraseSubjectOutput } from "#node/schemas/erase-subject-output.schema";

/** What `erase` did. */
interface Erased {
  /** Rows disposed of, per model. */
  readonly erased: ErasedRecords[];

  /** Rows a hold kept, per model. */
  readonly kept: KeptRecords[];

  /** True when a held row carries a shredded field, so the key must stay. */
  readonly keepKey: boolean;
}

/** The receipt's kind for the outbox messages `redact` rewrote or could not rewrite. */
const OUTBOX_KIND = "outbox.message";

/** The warning an incomplete erasure logs; ids and counts only. */
const UNREDACTED_LOG_EVENT = "privacy.erasure_unredacted";

/** The method a whole row gets: delete beats anonymise beats shred. */
function rowMethod(fields: Readonly<Record<string, ErasureMethod>>): ErasureMethod {
  const methods = Object.values(fields);
  if (methods.includes(ErasureMethod.Delete)) return ErasureMethod.Delete;
  if (methods.includes(ErasureMethod.Anonymise)) return ErasureMethod.Anonymise;
  return ErasureMethod.Shred;
}

/** `redact`'s result; a run started before STA-2629 stored the rewritten count alone. */
function redactionOf(result: SubjectRedaction | number): SubjectRedaction {
  return typeof result === "number" ? { rewritten: result, unrewritable: 0 } : result;
}

/** What was disposed of: the rows `erase` reached, then the outbox messages `redact` rewrote. */
function erasedOf(
  rows: readonly ErasedRecords[],
  redaction: SubjectRedaction | number,
): ErasedRecords[] {
  const messages = redactionOf(redaction).rewritten;
  return messages > 0
    ? [...rows, { kind: OUTBOX_KIND, method: ErasureMethod.Anonymise, count: messages }]
    : [...rows];
}

/** What was kept: the rows a hold kept, then the outbox messages `redact` could not rewrite (STA-2629). */
function keptOf(rows: readonly KeptRecords[], redaction: SubjectRedaction | number): KeptRecords[] {
  const messages = redactionOf(redaction).unrewritable;
  return messages > 0
    ? [...rows, { kind: OUTBOX_KIND, reason: "unredacted", count: messages }]
    : [...rows];
}

/**
 * The run timeout covers a subject with many rows across many models.
 *
 * @example
 * return ctx.run<EraseSubjectOutput>(EraseSubjectWorkflow, input); // from EraseSubjectAction#handle
 */
export class EraseSubjectWorkflow extends Workflow<EraseSubjectInput>({ timeout: "1h" }) {
  /** Reads and disposes of the subject's rows. */
  private readonly store: PersonalDataStore;

  /** Destroys the subject key's salt. */
  private readonly salts: SubjectSaltStore;

  /** The service's outbox, whose held messages may still carry the subject's fields. */
  private readonly outbox: OutboxDriver;

  /** The container, asked for the bound `Logger` when an erasure is incomplete. */
  private readonly container: Container;

  /**
   * @param store - reads and disposes of the subject's rows.
   * @param salts - destroys the subject key's salt.
   * @param outbox - the service's outbox store.
   * @param container - the container, whose `Logger` (when bound) is warned of an incomplete erasure.
   */
  constructor(
    store: PersonalDataStore,
    salts: SubjectSaltStore,
    outbox: OutboxDriver,
    container: Container,
  ) {
    super();
    this.store = store;
    this.salts = salts;
    this.outbox = outbox;
    this.container = container;
  }

  /**
   * Deletes or anonymises every declared row of the subject that no hold covers; counts what a hold kept.
   *
   * @throws TypeError, before any row is touched, when a shredded field is not sealed under the subject's key.
   */
  async erase(run: Run<this>): Promise<Erased> {
    const declarations = personalDataDeclarations();
    const unsealed = declarations.flatMap(unsealedShredFields);
    if (unsealed.length > 0)
      throw new TypeError(
        `Shred needs a subject-sealed field, so these would stay readable: ${unsealed.join(", ")}. ` +
          "Seal them with HasEncryptedFields({ subject }) under the declaration's subject property",
      );
    const erased: ErasedRecords[] = [];
    const kept: KeptRecords[] = [];
    let keepKey = false;
    for (const { kind, model, subject, fields } of declarations) {
      const rows = await this.store.find(model, subject, run.input.subject, Object.keys(fields));
      if (rows.length === 0) continue;
      const method = rowMethod(fields);
      const ids = rows.map((row) => row.id);
      const free = await disposableIds(
        model,
        ids,
        method === ErasureMethod.Delete ? Disposal.Delete : Disposal.Edit,
      );
      const held = ids.length - free.length;
      const anonymised = Object.keys(fields).filter(
        (field) => fields[field] === ErasureMethod.Anonymise,
      );
      let count = free.length; // shred-only rows: the key covers them
      if (method === ErasureMethod.Delete) count = await this.store.remove(model, free);
      else if (method === ErasureMethod.Anonymise && free.length > 0)
        count = await this.store.anonymise(model, free, anonymised);
      if (count > 0) erased.push({ kind, method, count });
      if (held > 0) {
        kept.push({ kind, reason: "hold", count: held });
        if (Object.values(fields).includes(ErasureMethod.Shred)) keepKey = true;
      }
    }
    return { erased, kept, keepKey };
  }

  /**
   * Nulls every declared personal field in the held outbox messages that name the subject; how many it rewrote and
   * how many it found but could not rewrite. Held rows do not stop it: a hold preserves the record, not a copy waiting
   * for delivery.
   */
  async redact(run: Run<this>): Promise<SubjectRedaction> {
    const named = new Set(personalDataDeclarations().flatMap(({ fields }) => Object.keys(fields)));
    return redactSubjectMessages(this.outbox, run.input.subject, named);
  }

  /** Destroys the subject key's salt unless a held row still needs its shredded fields readable. */
  async shred(run: Run<this>): Promise<boolean> {
    if (run.results.erase.keepKey) return false;
    return this.salts.destroy(run.input.subject);
  }

  /**
   * Records the receipt, and the ack when another service's erasure waits on this one, both with what `redact` could
   * not rewrite; warns the bound logger when that is any message.
   */
  async receipt(run: Run<this>, ctx: StepContext): Promise<string> {
    const { erasureId, subject, ackAs } = run.input;
    const kept = keptOf(run.results.erase.kept, run.results.redact);
    const { unrewritable: unredacted } = redactionOf(run.results.redact);
    const erased = erasedOf(run.results.erase.erased, run.results.redact);
    const at = ctx.now().toISOString();
    ctx.record(
      SubjectErased.create({
        erasureId,
        subject,
        erased,
        kept,
        shredded: run.results.shred,
        unredacted,
        at,
      }),
    );
    if (ackAs !== undefined)
      ctx.record(ServiceAcked.create({ subject: erasureId, service: ackAs, kept }));
    if (unredacted > 0 && this.container.has(Logger))
      this.container.get(Logger).warn(UNREDACTED_LOG_EVENT, { erasureId, unredacted });
    return at;
  }

  /** The receipt, built from the step results. */
  output(run: Run<this>): EraseSubjectOutput {
    return EraseSubjectOutput.create({
      erasureId: run.input.erasureId,
      subject: run.input.subject,
      erased: erasedOf(run.results.erase.erased, run.results.redact),
      kept: keptOf(run.results.erase.kept, run.results.redact),
      shredded: run.results.shred,
      unredacted: redactionOf(run.results.redact).unrewritable,
      at: run.results.receipt,
    });
  }
}
