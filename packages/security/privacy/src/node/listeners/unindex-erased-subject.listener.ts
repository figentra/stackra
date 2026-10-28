/**
 * Stackra file contract:
 * Purpose: `UnindexErasedSubjectListener`, the search side of an erasure (gap gov6, stackra-275): after
 *          `SubjectErased`, every row of a `PersonalData` declaration that still names the subject (a shredded row,
 *          or one a legal hold kept) leaves the search index and, for a semantic model, the vector index, so an
 *          erased subject is no longer findable through a copy indexed before the erasure.
 * Boundary: subscribed by the type of the event parameter; runs after commit, in its own transaction and the event's
 *           scope, once per event id. Rows the saga deleted or anonymised need nothing here: their committed changes
 *           already reach the search change consumers. Removing is idempotent, so a redelivery changes nothing.
 *           `SearchForgetService` ignores a model that is not searchable. It acks nothing: `SubjectErased` names no
 *           waiting service, and the saga's own `ServiceAcked` covers a cross-service erasure.
 * Runtime: node
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0221 (decision 7: erasure removes search
 *                     documents); ADR 0078 (decision 4: listener semantics); ADR 0294 (decisions 4 and 16); gap gov6.
 */
import { Listener, type ListenerContext } from "@stackra/events";
import type { SearchForgetService } from "@stackra/search/node";

import type { PersonalDataStore } from "#contracts/ports/personal-data-store.port";
import type { SubjectErased } from "#core/events/subject-erased.event";
import { personalDataDeclarations } from "#core/functions/personal-data-declarations.function";

/**
 * Drops the erased subject's remaining rows from search.
 *
 * @example
 * await listener.handle(SubjectErased.create({ erasureId, subject: "usr_1", erased, kept, shredded: true, at }), ctx);
 */
export class UnindexErasedSubjectListener extends Listener {
  /** Finds the subject's rows. */
  private readonly store: PersonalDataStore;

  /** Removes rows from the search and vector indexes. */
  private readonly forget: SearchForgetService;

  /**
   * @param store - finds the subject's rows of each declared model.
   * @param forget - removes rows from every search index.
   */
  constructor(store: PersonalDataStore, forget: SearchForgetService) {
    super();
    this.store = store;
    this.forget = forget;
  }

  /** Forgets every declared row that still names the subject. */
  async handle(event: SubjectErased, _ctx: ListenerContext): Promise<void> {
    for (const { model, subject } of personalDataDeclarations()) {
      const rows = await this.store.find(model, subject, event.subject, []);
      await this.forget.forget(
        model,
        rows.map((row) => row.id),
      );
    }
  }
}
