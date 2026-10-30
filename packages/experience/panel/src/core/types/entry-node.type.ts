/**
 * Stackra file contract:
 * Purpose: `EntryNode`, one recorded infolist element of a View page: a value, a principal, money, a list or a section.
 * Boundary: a type only; built by `Entry.*`, `Section.of` and the infolist builder.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 1: infolist keys come from the get output).
 */
import type { Enum } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";

/** One infolist element. */
export type EntryNode =
  | {
      /** As typed, or a principal (avatar and name). */
      readonly kind: "value" | "principal";
      /** The record path. */
      readonly key: string;
      /** Whether the value has a copy button. */
      readonly copyable?: boolean;
      /** The enum whose labels and tones render the value; gen fills it from the record type. */
      readonly enum?: Enum.Any;
      /** The label key of each enum code, from the generated keys (`I18n.orders.enums.order_status`). */
      readonly labels?: Readonly<Record<string, I18nKey>>;
    }
  | {
      /** Money in its currency. */
      readonly kind: "money";
      /** The record path of the minor units. */
      readonly key: string;
      /** The record path of the currency code. */
      readonly currency: string;
      /** Whether the value has a copy button. */
      readonly copyable?: boolean;
    }
  | {
      /** A list of items as a small table. */
      readonly kind: "list";
      /** The record path of the list. */
      readonly key: string;
      /** The item paths shown as columns. */
      readonly columns: readonly string[];
    }
  | {
      /** A titled group of entries. */
      readonly kind: "section";
      /** The snake_case section name; its label is derived. */
      readonly name: string;
      /** The entries in it. */
      readonly entries: readonly EntryNode[];
      /** Whether the section sits in the side column. */
      readonly aside?: boolean;
    };
