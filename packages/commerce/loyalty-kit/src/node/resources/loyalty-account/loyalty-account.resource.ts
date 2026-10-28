/**
 * Stackra file contract:
 * Purpose: `LoyaltyAccountResource`, the staff screens for loyalty accounts in the admin area: a searchable, filterable
 *          list, the View page, enrolment and freezing. Declared here, rendered by @stackra/panel; a package module
 *          contributes UI exactly like a service module.
 * Boundary: a declaration; gen runs each member once and records the tree in the manifest. Pages follow from
 *           `operations`: List and View are standard reads gen writes (`loyalty_kit.loyalty_account.list@1` and
 *           `.get@1`) whose row is `LoyaltyAccountView`, not the model, so the row is the second type argument and
 *           table and infolist keys are paths of that view; Create submits `EnrollMemberAction`, so form keys are paths
 *           of its input. Search comes from the model's `@Searchable` text fields and every sortable or filterable key
 *           is one of its indexed filters. Every button is in `actions`: placement follows the action's input (the
 *           record id puts Freeze on rows and View), `.bulk()` adds the bulk bar, and the L2 permission makes the panel
 *           confirm. Labels are derived (`loyalty_kit::resources.loyalty_account.*`); the group and the icon are the
 *           stand-in typed constants until gen writes `I18n` and `Icons`.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 3, 11, 13 and 16); ADR 0307 (rules 1 to 13); ADR 0164 as amended; ADR 0082
 *                     (API areas); owner decision R-56.
 */
import { ApiArea, SortDirection } from "@stackra/contracts";
import {
  type Actions,
  type Built,
  type Form,
  type FormNode,
  type Infolist,
  type InfolistNode,
  type PlacementNode,
  Resource,
  type Table,
  type TableNode,
} from "@stackra/panel";

import { LOYALTY_KIT_KEYS } from "#core/constants/loyalty-kit-keys.constant";
import type { LoyaltyAccountView } from "#core/schemas/loyalty-account-view.schema";
import { EnrollMemberAction } from "#node/actions/enroll-member.action";
import { FreezeAccountAction } from "#node/actions/freeze-account.action";
import { LOYALTY_KIT_ICONS } from "#node/constants/loyalty-kit-icons.constant";
import type { LoyaltyAccount } from "#node/models/loyalty-account.model";
import type { EnrollMemberInput } from "#node/schemas/enroll-member-input.schema";

/**
 * Buttons hide when the permission or the record policy refuses; the run still decides.
 *
 * @example
 * describeResource(LoyaltyAccountResource).table?.columns.map((column) => column.key);
 */
export class LoyaltyAccountResource extends Resource<LoyaltyAccount, LoyaltyAccountView>({
  area: ApiArea.Admin,
  navigation: {
    group: LOYALTY_KIT_KEYS.loyalty_kit.nav.loyalty,
    icon: LOYALTY_KIT_ICONS.Star,
    order: 30,
  },
  operations: { list: true, get: true, create: EnrollMemberAction },
}) {
  /** The list: the tier badge from the enum, frozen accounts flagged, newest first. */
  override table(t: Table<LoyaltyAccountView>): Built<TableNode> {
    return t
      .columns((c) => [
        c.from("memberId").copyable(),
        c.from("tier").sortable(),
        c.from("isFrozen"),
        c.from("frozenAt").hidden(),
        c.from("createdAt").sortable(),
      ])
      .filters((f) => [f.from("tier"), f.from("isFrozen"), f.from("createdAt"), f.trashed()])
      .defaultSort("createdAt", SortDirection.Desc);
  }

  /**
   * Enroll only: exactly the fields of `EnrollMemberInput` a person fills in. `accountId` is the PUT address the panel
   * mints when the form opens, so it is never a field.
   */
  override form(f: Form<EnrollMemberInput>): Built<FormNode> {
    return f.fields((x) => [x.from("principalId"), x.from("tier")]);
  }

  /** The View page: the account and when it was frozen. */
  override infolist(i: Infolist<LoyaltyAccountView>): Built<InfolistNode> {
    return i.entries((e) => [
      e.from("memberId"),
      e.from("tier"),
      e.from("isFrozen"),
      e.from("frozenAt"),
      e.from("createdAt"),
    ]);
  }

  /** Freeze on a row, on the View page and for a selection; the record fills `accountId`. */
  override actions(
    a: Actions<LoyaltyAccountView, LoyaltyAccountView>,
  ): readonly Built<PlacementNode>[] {
    return [a.run(FreezeAccountAction).bulk()];
  }
}
