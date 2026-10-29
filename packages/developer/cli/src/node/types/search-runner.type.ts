/**
 * Stackra file contract:
 * Purpose: `SearchRunner`, what `stackra search:reindex` and `search:status` call in the member:
 *          `searchReindex` (of `@stackra/data-maintenance/node`) queues a reindex job in the member's queue and answers
 *          its id, and `searchStatus` (of `@stackra/search/node`) answers every row of the member's index registry.
 * Boundary: type only. The CLI declares the shape it needs and imports the module from the member at run time, as it
 *           does for the settings runner; it never loads a model or reads a database itself.
 * Runtime: node
 * Governing contract: ADR 0404 (decision 3); ADR 0221 (decision 7: the reindex command); ADR 0282 (decision 3).
 */

/** A scope node: its public id and its `ltree` path. */
type ScopeNode = { readonly id: string; readonly path: string };

/** One index as the registry reports it. */
type SearchIndexRow = {
  readonly model: string;
  readonly scope?: ScopeNode;
  readonly state: string;
  readonly docCount: number;
  readonly cursor?: string;
  readonly rebuiltAt?: Date;
};

/** The search runner of one member. */
export type SearchRunner = {
  /** Queues one reindex job; `job` is `undefined` when one of that scope already waits or runs. */
  readonly searchReindex: (options: {
    readonly model?: string;
    readonly scope?: ScopeNode;
    readonly since?: string;
    readonly semantic?: boolean;
  }) => Promise<{ readonly job: string | undefined }>;

  /** Every index of the member's registry. */
  readonly searchStatus: () => Promise<readonly SearchIndexRow[]>;
};
