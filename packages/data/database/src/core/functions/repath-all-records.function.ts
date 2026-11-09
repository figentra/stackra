/**
 * Stackra file contract:
 * Purpose: `repathAllRecords(from, to)`, the re-path of every registered model with the `MovesWithScope` trait when a
 *          scope node moves: each model's `CrudService.repath(from, to)` in turn, one report per model.
 * Boundary: reads the registered entity schemas, which gen's entity files fill; runs on the running context's entity
 *           manager, so the caller's transaction and scope session hold (a scope that reaches both paths, as the move
 *           itself ran). A model opts in with the trait; one without it is never touched, and an `AppendOnly` model
 *           with the trait refuses, as `repath` does. Idempotent: run again, nothing lies under `from` any more.
 *           @stackra/scope's `RepathOnScopeMovedListener` calls it on every `scope.node.moved.v1`.
 * Runtime: node
 * Governing contract: ADR 0411 (subtree move); ADR 0327 (decision 3).
 */
import { traitsOf } from "@stackra/model";

import type { CrudService } from "#core/bases/crud-service.base";
import { REGISTERED_ENTITIES } from "#core/constants/registered-entities.constant";
import { repositoryOf } from "#core/functions/repository-of.function";
import type { RepathReport } from "#core/types/repath-report.type";

/**
 * Moves every opted-in model's rows at or below `from` to `to`.
 *
 * @throws TypeError when `from` or `to` is not an `ltree` path, or `to` lies below `from` (`repath`).
 * @throws AppendOnlyWriteError for an `AppendOnly` model with the trait.
 * @example
 * const reports = await repathAllRecords("platform.a.shop", "platform.b.shop");
 */
export async function repathAllRecords(from: string, to: string): Promise<readonly RepathReport[]> {
  const reports: RepathReport[] = [];
  for (const schema of REGISTERED_ENTITIES) {
    const model = schema.meta.class;
    if (!traitsOf(model).some((trait) => trait.name === "moves_with_scope")) continue;
    const repository = Reflect.construct(repositoryOf(model), []) as CrudService<object>;
    // oxlint-disable-next-line no-await-in-loop -- one model after another, in the caller's one transaction
    reports.push({ model: model.name, rows: await repository.repath(from, to) });
  }
  return reports;
}
