/**
 * Stackra file contract:
 * Purpose: the "tamo" demo of the web form: Fill from text: paste a signature and Tamo proposes the name, company and city, each marked for review (offline mock).
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { createMockTamoClient, TamoProvider } from "@stackra/ai/react";
import { Form, Text, TextArea, TextField, useCatalogueText } from "@stackra/ui/react";
import type { SchemaFormHandle } from "@stackra/ui/form";
import { useForm } from "react-hook-form";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_KEYS } from "#src/demos/free/form/form-keys.constant";

/** The demo's keys. */
const K = FORM_KEYS.form;
/** The offline client: plain rules, no keys, no network. */
const CLIENT = createMockTamoClient();

/** The new customer's fields. */
interface Customer {
  name: string;
  company: string;
  city: string;
  notes: string;
}

/** Form: Ask Tamo. */
export default function Tamo() {
  const t = useCatalogueText(MESSAGES.en);
  const rhf = useForm<Customer>({ defaultValues: { name: "", company: "", city: "", notes: "" } });
  // shortcut: a schema form by hand on react-hook-form (the playground has no schema package); an app uses useSchemaForm.
  const form: SchemaFormHandle<Customer> = {
    ...rhf,
    field: (name) => ({
      name,
      // oxlint-disable-next-line react/incompatible-library -- reason: react-hook-form's watch is read each render here, unmemoised by design
      value: rhf.watch(name),
      onChange: (value) => rhf.setValue(name, value),
      onBlur: () => undefined,
    }),
    handleSubmit: (onValid) => async (event) => {
      let result: Awaited<ReturnType<typeof onValid>> | undefined;
      await rhf.handleSubmit(async (values) => {
        result = await onValid(values);
      })(event);
      return result;
    },
  };
  return (
    <TamoProvider client={CLIENT} screen="customers" screenLabel={t(K.tamo_screen)}>
      <div className="grid max-w-md gap-3">
        <Text type="small" tone="muted">
          {t(K.tamo_paste)}
        </Text>
        <pre
          dir="auto"
          className="m-0 whitespace-pre-wrap rounded-[var(--radius-control)] bg-default p-2 text-sm"
        >
          {t(K.tamo_sample)}
        </pre>
        <Form form={form} aria-label={t(K.tamo_form)} className="grid gap-3">
          <TextField label={t(K.tamo_name)} {...form.field("name")} />
          <TextField label={t(K.tamo_company)} {...form.field("company")} />
          <TextField label={t(K.tamo_city)} {...form.field("city")} />
          <TextArea label={t(K.tamo_notes)} {...form.field("notes")} rows={2} />
        </Form>
      </div>
    </TamoProvider>
  );
}
