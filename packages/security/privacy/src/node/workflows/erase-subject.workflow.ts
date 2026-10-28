/**
 * Stackra file contract:
 * Purpose: `EraseSubjectWorkflow`, the erasure saga (GDPR Art. 17, PDPL Art. 4 right to destruction): `erase` deletes
 *          or anonymises the subject's rows of every registered `PersonalData` declaration that no legal hold covers,
 *          `shred` destroys the subject key's salt so every shredded field is unreadable, and `receipt` records
 *          `SubjectErased` (and the `ServiceAcked` a cross-service erasure waits on) with what was disposed of and kept.
 * Boundary: the public async methods are the steps, run in declaration order, each its own transaction. Holds are
 *           asked through `disposableIds` before anything is touched (`delete` for a row with a delete field, `edit`
 *           otherwise), and held rows are kept and counted. The key is shredded only when no held row carries a
 *           shredded field, since shredding would destroy what the hold preserves; the receipt says which. Erasure is
 *           not undone, so no step has an undo. Started only by `EraseSubjectAction` through `ctx.run`.
 * Runtime: node
 * Governing contract: ADR 0189 (decisions 2 and 4); ADR 0134 (legal holds); ADR 0212 (crypto-shredding); ADR 0210
 *                     (decision 6: `ServiceAcked`); ADR 0294 (decisions 16 and 18); ADR 0151; STA-1312; STA-1375.
 */
import { Disposal } from "@stackra/database/contracts";
import { disposableIds } from "@stackra/database";
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

/** The method a whole row gets: delete beats anonymise beats shred. */
function rowMethod(fields: Readonly<Record<string, ErasureMethod>>): ErasureMethod {
  const methods = Object.values(fields);
  if (methods.includes(ErasureMethod.Delete)) return ErasureMethod.Delete;
  if (methods.includes(ErasureMethod.Anonymise)) return ErasureMethod.Anonymise;
  return ErasureMethod.Shred;
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

  /**
   * @param store - reads and disposes of the subject's rows.
   * @param salts - destroys the subject key's salt.
   */
  constructor(store: PersonalDataStore, salts: SubjectSaltStore) {
    super();
    this.store = store;
    this.salts = salts;
  }

  /** Deletes or anonymises every declared row of the subject that no hold covers; counts what a hold kept. */
  async erase(run: Run<this>): Promise<Erased> {
    const erased: ErasedRecords[] = [];
    const kept: KeptRecords[] = [];
    let keepKey = false;
    for (const { kind, model, subject, fields } of personalDataDeclarations()) {
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

  /** Destroys the subject key's salt unless a held row still needs its shredded fields readable. */
  async shred(run: Run<this>): Promise<boolean> {
    if (run.results.erase.keepKey) return false;
    return this.salts.destroy(run.input.subject);
  }

  /** Records the receipt, and the ack when another service's erasure waits on this one. */
  async receipt(run: Run<this>, ctx: StepContext): Promise<string> {
    const { erasureId, subject, ackAs } = run.input;
    const { erased, kept } = run.results.erase;
    const at = ctx.now().toISOString();
    ctx.record(
      SubjectErased.create({ erasureId, subject, erased, kept, shredded: run.results.shred, at }),
    );
    if (ackAs !== undefined)
      ctx.record(ServiceAcked.create({ subject: erasureId, service: ackAs, kept }));
    return at;
  }

  /** The receipt, built from the step results. */
  output(run: Run<this>): EraseSubjectOutput {
    return EraseSubjectOutput.create({
      erasureId: run.input.erasureId,
      subject: run.input.subject,
      erased: run.results.erase.erased,
      kept: run.results.erase.kept,
      shredded: run.results.shred,
      at: run.results.receipt,
    });
  }
}
