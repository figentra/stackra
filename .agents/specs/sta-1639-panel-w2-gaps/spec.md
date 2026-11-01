# Feature Specification: panel gaps from Commerce · Frontend W2

**Created**: 2026-10-30

**Status**: Implementing <!-- builder mode: oxfmt and oxlint run here; the tester runs the rest -->

**Linear**: STA-1639

**Clarifications status**: complete

**Input**: eight `@stackra/panel` gaps that keep about 30 Commerce console actions unplaced (figentra/commerce #5, #7),
after the action input modal (STA-1627).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/experience/panel
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: amendment of ADR 0307 rule 3 (gap 6: any field besides the record id opens the modal form)
- **New dependencies**: none (`useSchemaField` from `@stackra/ui/form`)
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Licence tier**: free (`@stackra/panel`)
- **Docs to update**: the panel README and AGENTS.md; ADR 0307 rule 3
- **Change risk**: R1 (console UI only; the server still decides every run)

## Behaviour (one commit each, in this order)

1. Gap 5, labels: an action of another model than the resource's is labelled `actions.<model>_<verb>`
   (`company_member_set`); an action of the resource's own model keeps `actions.<verb>` (`actionLabelKey`).
2. Gap 1, header actions: a List header or empty-state action whose input has fields opens the modal, run once with no
   record.
3. Gap 6, optional inputs: any input key besides the record id opens the modal, so an action whose other fields are all
   optional still gets a form and its confirmation (ADR 0307 rule 3 amended).
4. Gap 2, lists and objects: a field whose input is an object draws its keys as a titled group; a list of objects draws
   as a repeater (add and remove rows); a list of strings or numbers as a repeater of one field.
5. Gap 4, prefill: the modal starts every form key from the record's value at the same path.
6. Gap 3, option labels: a select's options show each code's enum label (the same lookup as `ResourceValue`).
7. Gap 8, money inputs: a `…Minor` field is entered in major units in its currency (the value's own `currency`, else the
   record's) and stored in minor units; without a known currency it stays in minor units.
8. Gap 7, child-keyed actions: a relation manager takes record actions for its rows (`.actions(...)`), each row's id under
   the related model's id key and the relation's bound inputs (`runId`) filled in.

## Out of scope

- Native forms; upload fields; a step-set wizard.
